// app/dashboard.tsx
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';



export default function DashboardScreen() {
  const { classes, tasks, notes, reminders, loading } = useData();
  const router = useRouter();
  const { colors, theme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');



  const getCurrentDate = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const now = new Date();
    return `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
  };

  const getToday = () => new Date().toLocaleDateString('en-US', { weekday: 'long' });

  const getTodayClasses = () => classes.filter(c => c.day === getToday());
  const getPendingTasks = () => tasks.filter(t => t.status !== 'done');
  const getRecentNotes = () => notes.slice(0, 2);
  const getTodayReminders = () => reminders.slice(0, 2);

  useEffect(() => {
  loadUser();
}, []);

const loadUser = async () => {
  try {
    const userStr = await AsyncStorage.getItem('@plansync:current_user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  } catch (error) {}
};

const getUpcomingTasks = () => {
  // Sort by due date (closest first), then filter out done tasks
  return (tasks || [])
    .filter((t: any) => t.status !== 'done')
    .sort((a: any, b: any) => {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      // Overdue tasks first, then closest future dates
      return dateA - dateB;
    })
    .slice(0, 3);
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

  const isOverdue = (dueDate: string) => {
  if (!dueDate) return false;
  const today = new Date(); today.setHours(0,0,0,0);
  const due = new Date(dueDate); due.setHours(0,0,0,0);
  return due < today;
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
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#4361ee" />
      </View>
    );
  }

  const isDark = theme === 'dark';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={[styles.searchBox, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
          <FontAwesome5 name="search" size={16} color="#6c7a8e" />
          <TextInput style={[styles.searchInput, { color: colors.text }]} placeholder="Search classes, tasks..." placeholderTextColor="#9aa6b5" value={searchQuery} onChangeText={setSearchQuery} />
        </View>

        {/* Welcome */}
        <View style={styles.welcomeRow}>
          <Text style={[styles.welcomeText, { color: colors.text }]}>
            Welcome back, <Text style={styles.highlight}>{user?.name?.split(' ')[0] || 'User'}</Text>!
          </Text>
          <Text style={[styles.welcomeSubtext, { color: colors.textSecondary }]}>Here's your academic day</Text>
        </View>

        {/* Date Chip */}
        <View style={[styles.dateChip, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <FontAwesome5 name="calendar-day" size={14} color="#334155" />
          <Text style={[styles.dateText, { color: colors.text }]}>{getCurrentDate()}</Text>
        </View>

{/* Stats Grid */}
<View style={styles.statsGrid}>
  {[
    { label: 'Classes today', icon: 'book-open', color: '#4361ee', solid: false, bg: styles.bgBlue, count: getTodayClasses().length, route: '/schedule' },
    { label: 'Pending tasks', icon: 'tasks', color: '#f25e5e', solid: false, bg: styles.bgCoral, count: getPendingTasks().length, route: '/tasks' },
    { label: 'Notes', icon: 'sticky-note', color: '#0ea5e9', solid: true, bg: styles.bgCyan, count: (notes||[]).length, route: '/notes' },
    { label: 'Reminders', icon: 'bell', color: '#8b5cf6', solid: true, bg: styles.bgPurple, count: getTodayReminders().length, route: '/reminders' },
  ].map((stat, i) => (
    <TouchableOpacity key={i} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]} onPress={() => router.push(stat.route as any)}>
      <View style={[styles.statIcon, stat.bg]}>
        <FontAwesome5 name={stat.icon} size={22} color={stat.color} solid={stat.solid} />
      </View>
      <Text style={[styles.statNumber, { color: colors.text }]}>{stat.count}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
    </TouchableOpacity>
  ))}
</View>

        {/* Quick Actions */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickRow}>
          {[
            { label: 'Add Task', route: '/tasks' },
            { label: 'Add Note', route: '/notes' },
            { label: 'Add Class', route: '/schedule' },
            { label: 'Reminder', route: '/reminders' },
          ].map((action, i) => (
            <TouchableOpacity key={i} style={[styles.quickChip, { backgroundColor: colors.card, borderColor: colors.cardBorder }]} onPress={() => router.push(action.route as any)}>
              <FontAwesome5 name="plus-circle" size={16} color="#4361ee" />
              <Text style={[styles.quickChipText, { color: colors.text }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Today's Classes */}
<View style={styles.sectionHeader}>
  <Text style={[styles.sectionTitle, { color: colors.text }]}>
    <FontAwesome5 name="calendar-day" size={16} color="#4361ee" />  Today's classes
  </Text>
  <TouchableOpacity onPress={() => router.push('/schedule')}>
    <Text style={styles.sectionLink}>View all</Text>
  </TouchableOpacity>
</View>
<View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
  {getTodayClasses().length === 0 ? (
    <View style={styles.emptyCard}>
      <FontAwesome5 name="calendar-day" size={24} color="#cbd5e1" />
      <Text style={[styles.emptyCardText, { color: colors.textSecondary }]}>No classes today</Text>
      <TouchableOpacity onPress={() => router.push('/schedule')}>
        <Text style={styles.addLink}>+ Add class</Text>
      </TouchableOpacity>
    </View>
  ) : (
    getTodayClasses().slice(0, 3).map((cls: any, index: number) => (
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
          <Text style={[styles.itemTitle, { color: colors.text }]}>{cls.name || cls.title}</Text>
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
  <Text style={[styles.sectionTitle, { color: colors.text }]}>
    <FontAwesome5 name="hourglass-half" size={16} color="#4361ee" />  Upcoming tasks
  </Text>
  <TouchableOpacity onPress={() => router.push('/tasks')}>
    <Text style={styles.sectionLink}>View all</Text>
  </TouchableOpacity>
</View>
<View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
  {getUpcomingTasks().length === 0 ? (
    <View style={styles.emptyCard}>
      <FontAwesome5 name="clipboard-list" size={24} color="#cbd5e1" />
      <Text style={[styles.emptyCardText, { color: colors.textSecondary }]}>No pending tasks</Text>
      <TouchableOpacity onPress={() => router.push('/tasks')}>
        <Text style={styles.addLink}>+ Add task</Text>
      </TouchableOpacity>
    </View>
  ) : (
    getUpcomingTasks().map((task: any, index: number) => (
<TouchableOpacity 
  key={task.id} 
  style={[styles.listItem, 
    index < getUpcomingTasks().length - 1 && styles.listItemBorder,
    task.priority === 'high' && styles.priorityHighBg
  ]}
  onPress={() => router.push('/tasks')}
>
        <View style={styles.itemLeft}>
          <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(task.priority) }]} />
        </View>
        <View style={styles.itemContent}>
          <Text style={[styles.itemTitle, { color: colors.text }]}>{task.title}</Text>
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

{/* Reminders */}
<View style={styles.sectionHeader}>
  <Text style={[styles.sectionTitle, { color: colors.text }]}>
    <FontAwesome5 name="bell" size={16} color="#4361ee" />  Reminders
  </Text>
  <TouchableOpacity onPress={() => router.push('/reminders')}>
    <Text style={styles.sectionLink}>All</Text>
  </TouchableOpacity>
</View>
<View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
  {getTodayReminders().length === 0 ? (
    <View style={styles.emptyCard}>
      <FontAwesome5 name="bell" size={24} color="#cbd5e1" />
      <Text style={[styles.emptyCardText, { color: colors.textSecondary }]}>No reminders</Text>
      <TouchableOpacity onPress={() => router.push('/reminders')}>
        <Text style={styles.addLink}>+ Add reminder</Text>
      </TouchableOpacity>
    </View>
  ) : (
    getTodayReminders().map((item: any, index: number) => (
      <TouchableOpacity 
        key={item.id || `rem-${index}`} 
        style={[styles.listItem, index < getTodayReminders().length - 1 && styles.listItemBorder]}
        onPress={() => router.push('/reminders')}
      >
        <View style={styles.itemLeft}>
          <View style={[styles.reminderIcon, { backgroundColor: item.color || '#8b5cf6' }]}>
            <FontAwesome5 name="bell" size={16} color="#FFFFFF" solid />
          </View>
        </View>
        <View style={styles.itemContent}>
          <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title || 'Reminder'}</Text>
          <View style={styles.itemMeta}>
            <FontAwesome5 name="clock" size={12} color="#7c8ba0" />
            <Text style={styles.metaText}> {item.time || 'No time'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    ))
  )}
</View>
        {/* Sections */}
        {[
          { title: 'Recent notes', icon: 'sticky-note', data: getRecentNotes(), route: '/notes', emptyText: 'No notes yet', addText: '+ Add note', render: (_note: any) => (
            <View style={styles.itemLeft}>
              <View style={styles.noteIcon}>
                <FontAwesome5 name="file-alt" size={18} color="#FFFFFF" solid />
              </View>
            </View>
          )},

        ].map((section, si) => (
          <View key={si}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                <FontAwesome5 name={section.icon} size={16} color="#4361ee" />  {section.title}
              </Text>
              <TouchableOpacity onPress={() => router.push(section.route as any)}>
                <Text style={styles.sectionLink}>View all</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              {section.data.length === 0 ? (
                <View style={styles.emptyCard}>
                  <FontAwesome5 name={section.icon} size={24} color="#cbd5e1" />
                  <Text style={[styles.emptyCardText, { color: colors.textSecondary }]}>{section.emptyText}</Text>
                  <TouchableOpacity onPress={() => router.push(section.route as any)}>
                    <Text style={styles.addLink}>{section.addText}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                section.data.map((item: any, index: number) => (
                  <TouchableOpacity 
                    key={item.id || index} 
                    style={[styles.listItem, index < section.data.length - 1 && styles.listItemBorder]}
                    onPress={() => router.push(section.route as any)}
                  >
                    {section.render(item)}
                    <View style={styles.itemContent}>
                      <Text style={[styles.itemTitle, { color: colors.text }]}>{item.name || item.title}</Text>
                      <View style={styles.itemMeta}>
                        {item.location && <><FontAwesome5 name="map-marker-alt" size={12} color="#7c8ba0" /><Text style={styles.metaText}> {item.location}</Text></>}
                        {item.dueDate && <><FontAwesome5 name="calendar-alt" size={12} color="#7c8ba0" /><Text style={styles.metaText}> {formatDate(item.dueDate)}</Text></>}
                        {item.time && <><FontAwesome5 name="clock" size={12} color="#7c8ba0" /><Text style={styles.metaText}> {item.time}</Text></>}
                        {item.content && <Text style={styles.metaText} numberOfLines={1}>{item.content?.substring(0, 50)}</Text>}
                        {item.status && (
                          <View style={[styles.statusBadge, item.status === 'todo' ? styles.statusTodo : item.status === 'inprogress' ? styles.statusInProgress : styles.statusDone]}>
                            <Text style={styles.statusText}>{item.status === 'todo' ? 'To Do' : item.status === 'inprogress' ? 'In Progress' : 'Done'}</Text>
                          </View>
                        )}
                      </View>
                      {item.color && <View style={[styles.colorDot, { backgroundColor: item.color }]} />}
                      {item.tags && item.tags.length > 0 && (
                        <View style={styles.tagsRow}>
                          {item.tags.slice(0, 2).map((tag: string, idx: number) => (
                            <View key={idx} style={[styles.tag, { backgroundColor: isDark ? '#334155' : '#eef2f6' }]}>
                              <Text style={[styles.tagText, { color: isDark ? '#94a3b8' : '#44566c' }]}>{tag}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  searchBox: { borderRadius: 30, paddingHorizontal: 18, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  searchInput: { flex: 1, fontSize: 16 },
  welcomeRow: { marginBottom: 12 },
  welcomeText: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  highlight: { color: '#4361ee' },
  welcomeSubtext: { fontSize: 14 },
  dateChip: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 40, paddingHorizontal: 18, paddingVertical: 8, borderWidth: 1, alignSelf: 'flex-start', marginBottom: 20 },
  dateText: { fontSize: 13, fontWeight: '500' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: { borderRadius: 24, padding: 16, width: '47%', borderWidth: 1, elevation: 2 },
  statIcon: { width: 48, height: 48, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  bgBlue: { backgroundColor: '#eef3ff' },
  bgCoral: { backgroundColor: '#ffeae5' },
  bgCyan: { backgroundColor: '#e0f2fe' },
  bgPurple: { backgroundColor: '#f1e5ff' },
  statNumber: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: 13, fontWeight: '500' },
  quickRow: { marginBottom: 24 },
  quickChip: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 40, paddingHorizontal: 18, paddingVertical: 10, marginRight: 10 },
  quickChipText: { fontSize: 13, fontWeight: '500' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  sectionLink: { fontSize: 13, fontWeight: '600', color: '#4361ee' },
  card: { borderRadius: 28, padding: 18, marginBottom: 24, borderWidth: 1, elevation: 2 },
listItem: { 
  flexDirection: 'row', 
  alignItems: 'center',
  gap: 12, 
  paddingVertical: 12,
},
  listItemBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  itemLeft: { flexShrink: 0 },
  timeChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 30 },
  timeText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  priorityDot: { width: 10, height: 10, borderRadius: 10, marginTop: 6 },
  noteIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#4361ee', justifyContent: 'center', alignItems: 'center' },
  reminderIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  itemContent: { flex: 1 },
 itemTitle: { 
  fontSize: 15, 
  fontWeight: '700', 
  marginBottom: 2,
},
 itemMeta: { 
  flexDirection: 'row', 
  alignItems: 'center', 
  gap: 6,
  marginTop: 2,
},
  metaText: { fontSize: 13, color: '#62748c' },
  colorDot: { width: 6, height: 40, borderRadius: 20, flexShrink: 0 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 40 },
  statusTodo: { backgroundColor: '#fff3cd' },
  statusInProgress: { backgroundColor: '#cce5ff' },
  statusDone: { backgroundColor: '#d4edda' },
  statusText: { fontSize: 10, fontWeight: '600', color: '#475569' },
  tagsRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  tag: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 30 },
  tagText: { fontSize: 11 },
  emptyCard: { alignItems: 'center', paddingVertical: 20 },
  emptyCardText: { fontSize: 14, marginTop: 8, marginBottom: 8 },
  addLink: { fontSize: 13, color: '#4361ee', fontWeight: '600' },
  colorDotSmall: { 
  width: 8, 
  height: 8, 
  borderRadius: 4, 
  flexShrink: 0,
  marginTop: 6,
  },
priorityBar: {
  width: 4,
  height: '100%',
  borderRadius: 2,
  position: 'absolute',
  left: 0,
  top: 0,
  bottom: 0,
},
taskInfoContainer: {
  flex: 1,
  paddingLeft: 12,
  borderRadius: 8,
},
taskTopRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 6,
  gap: 8,
},
taskMetaRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},
priorityLabel: {
  fontSize: 10,
  fontWeight: '700',
  letterSpacing: 0.5,
},
priorityHighBg: {
  backgroundColor: 'rgba(220, 53, 69, 0.08)',
  borderRadius: 16,
  marginHorizontal: -8,
  paddingHorizontal: 8,
},
});