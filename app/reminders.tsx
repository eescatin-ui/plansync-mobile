// app/reminders.tsx
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AppHeader from '../components/AppHeader';
import BottomNav from '../components/BottomNav';
import { apiFetch } from '../services/api';
type ClassItem = {
  id: string;
  name: string;
  time: string;
  location: string;
  day: string;
  color: string;
};

type TaskItem = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'inprogress' | 'done';
};

type ReminderItem = {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  type: 'class' | 'task' | 'personal';
  status?: string;
  priority?: string;
  color: string;
  icon: string;
  originalId: string;
  createdAt: string;
};

export default function RemindersScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<'today' | 'tomorrow' | 'personal'>('today');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [personalReminders, setPersonalReminders] = useState<ReminderItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [saving, setSaving] = useState(false);
  const [reminderToDelete, setReminderToDelete] = useState<ReminderItem | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    id: '',
    title: '',
    subtitle: '',
    time: '',
    type: 'personal' as 'class' | 'task' | 'personal',
    color: '#4361ee',
  });

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [reminderYear, setReminderYear] = useState(new Date().getFullYear());
  const [reminderMonth, setReminderMonth] = useState(new Date().getMonth());
  const [reminderDay, setReminderDay] = useState(new Date().getDate());
  const [reminderDate, setReminderDate] = useState('');

  // Time picker state
  const [reminderStartHour, setReminderStartHour] = useState('9');
  const [reminderStartMinute, setReminderStartMinute] = useState('00');
  const [reminderStartPeriod, setReminderStartPeriod] = useState('AM');

  const allHours = [
    { label: '1', value: '1' }, { label: '2', value: '2' }, { label: '3', value: '3' },
    { label: '4', value: '4' }, { label: '5', value: '5' }, { label: '6', value: '6' },
    { label: '7', value: '7' }, { label: '8', value: '8' }, { label: '9', value: '9' },
    { label: '10', value: '10' }, { label: '11', value: '11' }, { label: '12', value: '12' },
  ];
  const minutes = ['00', '15', '30', '45'];
  const periods = ['AM', 'PM'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  useEffect(() => {
    loadData();
  }, []);

 const loadData = async () => {
    try {
      const [savedClasses, savedTasks, savedReminders] = await Promise.all([
        apiFetch('/courses'),
        apiFetch('/tasks'),
        apiFetch('/reminders'),
      ]);
      if (savedClasses) setClasses(savedClasses);
      if (savedTasks) setTasks(savedTasks);
      if (savedReminders) setPersonalReminders(savedReminders);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Get today's date info
  const getToday = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const getTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toLocaleDateString('en-US', { weekday: 'long' });
  };

  // Convert class to reminder format
  const classToReminder = (cls: ClassItem): any => {
    const today = getToday();
    const isToday = cls.day === today;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const timeParts = cls.time.split('-');
    const startTime = timeParts[0]?.trim() || '';
    const endTime = timeParts[1]?.trim() || '';
    
    const startMinutes = convertTimeToMinutes(startTime);
    const endMinutes = convertTimeToMinutes(endTime);
    const isNow = isToday && currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    const isSoon = isToday && !isNow && startMinutes > currentMinutes && (startMinutes - currentMinutes) <= 60;

    let badge = 'Class';
    let badgeColor = '#17a2b8';
    let cardColor = '#17a2b8';
    let timeDisplay = `${startTime} - ${endTime}`;
    
    if (isNow) {
      badge = 'Now';
      badgeColor = '#e63946';
      cardColor = '#e63946';
      timeDisplay = `Now · ${startTime} - ${endTime}`;
    } else if (isSoon) {
      badge = 'Soon';
      badgeColor = '#f72585';
      cardColor = '#f72585';
      timeDisplay = `${startTime} - ${endTime}`;
    }

    return {
      id: `class-${cls.id}`,
      title: cls.name,
      subtitle: `${cls.location}`,
      time: timeDisplay,
      type: 'class',
      color: cardColor,
      icon: 'book-open',
      originalId: cls.id,
      createdAt: '',
      badge,
      badgeColor,
    };
  };

  // Convert task to reminder format
  const taskToReminder = (task: TaskItem): any => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const isOverdue = dueDate < today;
    
    let timeDisplay = `Due ${formatDate(task.dueDate)}`;
    let color = task.priority === 'high' ? '#dc3545' : task.priority === 'medium' ? '#ffb300' : '#28a745';
    
    if (isOverdue) {
      timeDisplay = 'Overdue';
      color = '#dc3545';
    }

    return {
      id: `task-${task.id}`,
      title: task.title,
      subtitle: task.description || 'No description',
      time: timeDisplay,
      type: 'task',
      status: `${formatStatus(task.status)} · ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}`,
      priority: task.priority,
      color,
      icon: 'flag',
      originalId: task.id,
      createdAt: '',
      badge: 'Task',
      badgeColor: '#ffb300',
      statusStyle: task.status,
    };
  };

  const convertTimeToMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    let hours = 0, minutes = 0, isPM = false;
    const ampmMatch = timeStr.match(/(am|pm)/i);
    if (ampmMatch) isPM = ampmMatch[1].toLowerCase() === 'pm';
    const timeParts = timeStr.replace(/(am|pm)/i, '').trim().split(':');
    hours = parseInt(timeParts[0], 10) || 0;
    minutes = parseInt(timeParts[1], 10) || 0;
    if (isPM && hours < 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDateFull = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${months[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
  };

  const formatStatus = (status: string) => {
    const map: Record<string, string> = { 'todo': 'To Do', 'inprogress': 'In Progress', 'done': 'Done' };
    return map[status] || status;
  };

  // Get filtered reminders
  const getFilteredReminders = (): any[] => {
    const today = getToday();
    const tomorrow = getTomorrow();
    
    const classReminders = classes.map(classToReminder);
    const taskReminders = tasks.filter(t => t.status !== 'done').map(taskToReminder);
    
    let all: any[] = [];
    
    if (filter === 'today') {
      all = [
        ...classReminders.filter(r => classes.find(c => `class-${c.id}` === r.id)?.day === today),
        ...taskReminders.filter(r => {
          const task = tasks.find(t => `task-${t.id}` === r.id);
          if (!task) return false;
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          return dueDate <= now;
        }),
      ];
    } else if (filter === 'tomorrow') {
      all = [
        ...classReminders.filter(r => classes.find(c => `class-${c.id}` === r.id)?.day === tomorrow),
        ...taskReminders.filter(r => {
          const task = tasks.find(t => `task-${t.id}` === r.id);
          if (!task) return false;
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          const tomorrowDate = new Date();
          tomorrowDate.setDate(tomorrowDate.getDate() + 1);
          tomorrowDate.setHours(0, 0, 0, 0);
          return dueDate.getTime() === tomorrowDate.getTime();
        }),
      ];
    } else {
      all = [...personalReminders];
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      all = all.filter(r => 
        r.title.toLowerCase().includes(query) ||
        r.subtitle.toLowerCase().includes(query)
      );
    }
    return all;
  };

  const getClasses = () => getFilteredReminders().filter(r => r.type === 'class');
  const getTasks = () => getFilteredReminders().filter(r => r.type === 'task');
  const getPersonal = () => getFilteredReminders().filter(r => r.type === 'personal');

  const handleCardPress = (item: any) => {
    if (item.type === 'class') {
      router.push('/schedule');
    } else if (item.type === 'task') {
      router.push('/tasks');
    }
  };

  // Date picker functions
  const openDatePicker = () => {
    if (reminderDate) {
      const [y, m, d] = reminderDate.split('-').map(Number);
      setReminderYear(y);
      setReminderMonth(m - 1);
      setReminderDay(d);
    }
    setShowDatePicker(true);
  };

  const confirmReminderDate = () => {
    const dateStr = `${reminderYear}-${String(reminderMonth + 1).padStart(2, '0')}-${String(reminderDay).padStart(2, '0')}`;
    setReminderDate(dateStr);
    setShowDatePicker(false);
  };

  // CRUD for personal reminders
  const openAddModal = () => {
    setModalMode('add');
    setForm({ id: '', title: '', subtitle: '', time: '', type: 'personal', color: '#4361ee' });
    setReminderDate('');
    setReminderStartHour('9');
    setReminderStartMinute('00');
    setReminderStartPeriod('AM');
    setShowModal(true);
  };

  const openEditModal = (item: ReminderItem) => {
    setModalMode('edit');
    setForm({
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      time: item.time,
      type: item.type,
      color: item.color,
    });
    setReminderDate('');
    setReminderStartHour('9');
    setReminderStartMinute('00');
    setReminderStartPeriod('AM');
    setShowModal(true);
  };

const saveReminder = async () => {
    if (!form.title.trim()) {
      Alert.alert('Error', 'Reminder title is required.');
      return;
    }
    setSaving(true);
    try {
      const timeStr = `${reminderStartHour}:${reminderStartMinute} ${reminderStartPeriod}`;
      const fullTimeStr = reminderDate ? `${formatDateFull(reminderDate)}, ${timeStr}` : timeStr;
      
      if (modalMode === 'add') {
        const newReminder = await apiFetch('/reminders', {
          method: 'POST',
          body: JSON.stringify({
            title: form.title.trim(),
            subtitle: form.subtitle.trim(),
            time: fullTimeStr,
            type: 'personal',
            color: form.color,
            icon: 'bell',
          }),
        });
        setPersonalReminders(prev => [...prev, newReminder]);
      } else {
        const updatedReminder = await apiFetch(`/reminders/${form.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: form.title.trim(),
            subtitle: form.subtitle.trim(),
            time: fullTimeStr,
            type: 'personal',
            color: form.color,
            icon: 'bell',
          }),
        });
        setPersonalReminders(prev => prev.map(r => r.id === updatedReminder.id ? updatedReminder : r));
      }
      Alert.alert('Success', modalMode === 'add' ? 'Reminder added!' : 'Reminder updated!');
      setShowModal(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save reminder.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteReminder = (item: ReminderItem) => {
    if (item.type !== 'personal') return;
    setReminderToDelete(item);
    setShowDeleteModal(true);
  };

const deleteReminder = async () => {
    if (!reminderToDelete) return;
    setDeleting(true);
    try {
      await apiFetch(`/reminders/${reminderToDelete.id}`, { method: 'DELETE' });
      setPersonalReminders(prev => prev.filter(r => r.id !== reminderToDelete.id));
      setShowDeleteModal(false);
      setReminderToDelete(null);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to delete reminder.');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusStyle = (statusStyle: string) => {
    switch (statusStyle) {
      case 'todo': return styles.statusTodo;
      case 'inprogress': return styles.statusInProgress;
      case 'done': return styles.statusDone;
      default: return {};
    }
  };

  const getStatusTextStyle = (statusStyle: string) => {
    switch (statusStyle) {
      case 'todo': return styles.statusTextTodo;
      case 'inprogress': return styles.statusTextInProgress;
      case 'done': return styles.statusTextDone;
      default: return {};
    }
  };

  const getCardStyle = (item: any) => {
    if (item.type === 'class' && item.badge === 'Now') return styles.classNow;
    if (item.type === 'class' && item.badge === 'Soon') return styles.classUpcoming;
    if (item.type === 'class') return styles.classReminder;
    if (item.type === 'task') return styles.taskReminder;
    return styles.userReminder;
  };

  const getBadgeStyle = (item: any) => {
    if (item.type === 'class' && item.badge === 'Now') return styles.badgeClassNow;
    if (item.type === 'class' && item.badge === 'Soon') return styles.badgeClassUpcoming;
    if (item.type === 'class') return styles.badgeClass;
    if (item.type === 'task') return styles.badgeTask;
    return styles.badgePersonal;
  };

  const renderReminderCard = (item: any) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.reminderCard, getCardStyle(item), viewMode === 'grid' && styles.reminderCardGrid]}
      onPress={() => item.type === 'personal' ? openEditModal(item) : handleCardPress(item)}
      onLongPress={() => confirmDeleteReminder(item)}
    >
      <View style={styles.reminderCardHeader}>
        <View style={styles.reminderTime}>
          <FontAwesome5 
            name={item.time?.includes('Now') ? 'play-circle' : item.time?.includes('Overdue') ? 'exclamation-circle' : 'clock'} 
            size={12} 
            color={item.time?.includes('Overdue') ? '#e63946' : '#64748b'} 
          />
          <Text style={[styles.reminderTimeText, item.time?.includes('Overdue') && { color: '#e63946' }]}>
            {item.time}
          </Text>
        </View>
        <View style={[styles.reminderBadge, getBadgeStyle(item)]}>
          <FontAwesome5 
            name={item.type === 'class' ? 'book' : item.type === 'task' ? 'tasks' : 'bell'} 
            size={10} 
            color={item.badge === 'Now' || item.badge === 'Soon' ? '#FFFFFF' : undefined} 
          />
          <Text style={[styles.reminderBadgeText, (item.badge === 'Now' || item.badge === 'Soon') && { color: '#FFFFFF' }]}>
            {item.badge}
          </Text>
        </View>
      </View>

      <View style={[styles.reminderCardBody, viewMode === 'grid' && styles.reminderCardBodyGrid]}>
        <View style={[styles.reminderIcon, { backgroundColor: item.color + '20' }]}>
          <FontAwesome5 name={item.icon} size={18} color={item.color} />
        </View>
        <View style={styles.reminderContent}>
          <Text style={styles.reminderTitle}>{item.title}</Text>
          <Text style={styles.reminderSubtitle} numberOfLines={1}>
            <FontAwesome5 name="map-marker-alt" size={10} color="#94a3b8" /> {item.subtitle}
          </Text>
          {item.status && (
            <View style={[styles.taskStatus, getStatusStyle(item.statusStyle)]}>
              <Text style={[styles.taskStatusText, getStatusTextStyle(item.statusStyle)]}>{item.status}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.reminderCardFooter}>
        <View style={styles.reminderSource}>
          <FontAwesome5 
            name={item.type === 'class' ? 'calendar-alt' : item.type === 'task' ? 'check-circle' : 'user'} 
            size={11} 
            color="#94a3b8" 
          />
          <Text style={styles.reminderSourceText}>
            {item.type === 'class' ? 'Class' : item.type === 'task' ? `Task · ${item.status?.includes('High') ? 'High' : item.status?.includes('Medium') ? 'Medium' : 'Low'} Priority` : 'Personal'}
          </Text>
        </View>
        <View style={styles.reminderActions}>
          {item.type === 'class' ? (
            <TouchableOpacity onPress={() => router.push('/schedule')}>
              <FontAwesome5 name="calendar-alt" size={14} color="#94a3b8" />
            </TouchableOpacity>
          ) : item.type === 'task' ? (
            <TouchableOpacity onPress={() => router.push('/tasks')}>
              <FontAwesome5 name="tasks" size={14} color="#94a3b8" />
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity onPress={() => openEditModal(item)}>
                <FontAwesome5 name="edit" size={14} color="#94a3b8" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => confirmDeleteReminder(item)}>
                <FontAwesome5 name="trash-alt" size={14} color="#94a3b8" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const reminders = getFilteredReminders();
  const todayCount = classes.filter(c => c.day === getToday()).length + tasks.filter(t => {
    const d = new Date(t.dueDate); d.setHours(0,0,0,0);
    const n = new Date(); n.setHours(0,0,0,0);
    return d <= n && t.status !== 'done';
  }).length;
  const tomorrowCount = classes.filter(c => c.day === getTomorrow()).length + tasks.filter(t => {
    const d = new Date(t.dueDate); d.setHours(0,0,0,0);
    const n = new Date(); n.setDate(n.getDate()+1); n.setHours(0,0,0,0);
    return d.getTime() === n.getTime() && t.status !== 'done';
  }).length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fbfdff" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <AppHeader title="Reminders" icon="bell" />

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          {[
            { key: 'today', icon: 'sun', label: 'Today', count: todayCount },
            { key: 'tomorrow', icon: 'calendar-day', label: 'Tomorrow', count: tomorrowCount },
            { key: 'personal', icon: 'user', label: 'Personal', count: personalReminders.length },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.filterTab, filter === tab.key && styles.filterTabActive]}
              onPress={() => setFilter(tab.key as any)}
            >
              <FontAwesome5 name={tab.icon} size={14} color={filter === tab.key ? '#4361ee' : '#64748b'} />
              <Text style={[styles.filterTabText, filter === tab.key && styles.filterTabTextActive]}>{tab.label}</Text>
              <View style={[styles.filterCount, filter === tab.key && styles.filterCountActive]}>
                <Text style={[styles.filterCountText, filter === tab.key && styles.filterCountTextActive]}>{tab.count}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search and View Toggle */}
        <View style={styles.actionBar}>
          <View style={styles.searchBox}>
            <FontAwesome5 name="search" size={14} color="#94a3b8" />
            <TextInput style={styles.searchInput} placeholder="Search reminders..." placeholderTextColor="#9aa6b5" value={searchQuery} onChangeText={setSearchQuery} />
          </View>
          <View style={styles.viewToggle}>
            <TouchableOpacity style={[styles.viewToggleBtn, viewMode === 'list' && styles.viewToggleBtnActive]} onPress={() => setViewMode('list')}>
              <FontAwesome5 name="list" size={16} color={viewMode === 'list' ? '#FFFFFF' : '#64748b'} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.viewToggleBtn, viewMode === 'grid' && styles.viewToggleBtnActive]} onPress={() => setViewMode('grid')}>
              <FontAwesome5 name="th-large" size={16} color={viewMode === 'grid' ? '#FFFFFF' : '#64748b'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Classes Section */}
        {getClasses().length > 0 && (
          <>
            <View style={[styles.sectionHeader, styles.sectionClasses]}>
              <FontAwesome5 name="book-open" size={14} color="#e63946" />
              <Text style={[styles.sectionTitle, { color: '#e63946' }]}>
                {filter === 'today' ? "Today's Classes" : filter === 'tomorrow' ? "Tomorrow's Classes" : 'Classes'}
              </Text>
              <View style={styles.sectionCount}><Text style={styles.sectionCountText}>{getClasses().length}</Text></View>
            </View>
            <View style={viewMode === 'grid' ? styles.remindersGrid : styles.remindersList}>
              {getClasses().map(renderReminderCard)}
            </View>
          </>
        )}

        {/* Tasks Section */}
        {getTasks().length > 0 && (
          <>
            <View style={[styles.sectionHeader, styles.sectionTasks]}>
              <FontAwesome5 name="tasks" size={14} color="#ffb300" />
              <Text style={[styles.sectionTitle, { color: '#ffb300' }]}>
                {filter === 'today' ? "Today's Tasks" : filter === 'tomorrow' ? "Tomorrow's Tasks" : 'Tasks'}
              </Text>
              <View style={styles.sectionCount}><Text style={styles.sectionCountText}>{getTasks().length}</Text></View>
            </View>
            <View style={viewMode === 'grid' ? styles.remindersGrid : styles.remindersList}>
              {getTasks().map(renderReminderCard)}
            </View>
          </>
        )}

        {/* Personal Section */}
        {getPersonal().length > 0 && (
          <>
            <View style={[styles.sectionHeader, styles.sectionPersonal]}>
              <FontAwesome5 name="user" size={14} color="#28a745" />
              <Text style={[styles.sectionTitle, { color: '#28a745' }]}>Personal Reminders</Text>
              <View style={styles.sectionCount}><Text style={styles.sectionCountText}>{getPersonal().length}</Text></View>
            </View>
            <View style={viewMode === 'grid' ? styles.remindersGrid : styles.remindersList}>
              {getPersonal().map(renderReminderCard)}
            </View>
          </>
        )}

        {/* Empty State */}
        {reminders.length === 0 && (
          <View style={styles.emptyState}>
            <FontAwesome5 name="bell-slash" size={56} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No reminders</Text>
            <Text style={styles.emptyText}>
              {filter === 'personal' ? 'Add personal reminders using the + button.' : 'No reminders for this filter.'}
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB - Only for personal reminders */}
      <TouchableOpacity style={styles.fab} onPress={openAddModal} activeOpacity={0.8}>
        <FontAwesome5 name="plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Add/Edit Personal Reminder Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                <FontAwesome5 name={modalMode === 'add' ? 'plus-circle' : 'edit'} size={18} color="#4361ee" />
                {' '}{modalMode === 'add' ? 'Add Reminder' : 'Edit Reminder'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <FontAwesome5 name="times" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
              
              {/* Title */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Title *</Text>
                <TextInput style={styles.formInput} placeholder="e.g., Doctor appointment" placeholderTextColor="#94a3b8" value={form.title} onChangeText={(text) => setForm(prev => ({ ...prev, title: text }))} />
              </View>

              {/* Details */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Details</Text>
                <TextInput style={styles.formInput} placeholder="e.g., Dr. Smith · Medical Center" placeholderTextColor="#94a3b8" value={form.subtitle} onChangeText={(text) => setForm(prev => ({ ...prev, subtitle: text }))} />
              </View>

              {/* Date - Calendar Picker Button */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Date</Text>
                <TouchableOpacity style={styles.datePickerBtn} onPress={openDatePicker}>
                  <FontAwesome5 name="calendar-alt" size={14} color="#4361ee" />
                  <Text style={styles.datePickerText}>
                    {reminderDate ? formatDateFull(reminderDate) : 'Select date'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Time - Time Pickers */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Time</Text>
                
                <Text style={styles.timeSectionLabel}>Time</Text>
                <View style={styles.timePickerRow}>
                  <View style={styles.pickerContainer}>
                    <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
                      {allHours.map((h, index) => (
                        <TouchableOpacity
                          key={`rh-${index}`}
                          style={[styles.pickerItem, reminderStartHour === h.value && styles.pickerItemActive]}
                          onPress={() => setReminderStartHour(h.value)}
                        >
                          <Text style={[styles.pickerItemText, reminderStartHour === h.value && styles.pickerItemTextActive]}>{h.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                  <Text style={styles.timeSeparator}>:</Text>
                  <View style={styles.pickerContainer}>
                    <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
                      {minutes.map((m, index) => (
                        <TouchableOpacity
                          key={`rm-${index}`}
                          style={[styles.pickerItem, reminderStartMinute === m && styles.pickerItemActive]}
                          onPress={() => setReminderStartMinute(m)}
                        >
                          <Text style={[styles.pickerItemText, reminderStartMinute === m && styles.pickerItemTextActive]}>{m}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                  <View style={styles.periodContainer}>
                    {periods.map((p) => (
                      <TouchableOpacity
                        key={`rp-${p}`}
                        style={[styles.periodBtn, reminderStartPeriod === p && styles.periodBtnActive]}
                        onPress={() => setReminderStartPeriod(p)}
                      >
                        <Text style={[styles.periodText, reminderStartPeriod === p && styles.periodTextActive]}>{p}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.timePreview}>
                  <FontAwesome5 name="clock" size={12} color="#4361ee" />
                  <Text style={styles.timePreviewText}>
                    {reminderStartHour}:{reminderStartMinute} {reminderStartPeriod}
                  </Text>
                </View>
              </View>

              {/* Color */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Color</Text>
                <View style={styles.colorRow}>
                  {['#4361ee', '#28a745', '#f59e0b', '#e63946', '#8b5cf6', '#0ea5e9'].map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[styles.colorDot, { backgroundColor: color }, form.color === color && styles.colorDotActive]}
                      onPress={() => setForm(prev => ({ ...prev, color }))}
                    />
                  ))}
                </View>
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              {modalMode === 'edit' && (
                <TouchableOpacity style={styles.modalDeleteBtn} onPress={() => { setShowModal(false); confirmDeleteReminder({ id: form.id, title: form.title, subtitle: form.subtitle, time: form.time, type: 'personal', color: form.color, icon: 'bell', originalId: '', createdAt: '' }); }}>
                  <FontAwesome5 name="trash" size={16} color="#ef4444" />
                  <Text style={styles.modalDeleteText}>Delete</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, saving && styles.btnDisabled]} onPress={saveReminder} disabled={saving}>
                <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <Modal visible={showDatePicker} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerContainer}>
            <Text style={styles.datePickerTitle}>Select Date</Text>
            <View style={styles.dateNav}>
              <TouchableOpacity onPress={() => { 
                if (reminderMonth === 0) { setReminderMonth(11); setReminderYear(prev => prev - 1); } 
                else { setReminderMonth(prev => prev - 1); } 
              }}>
                <FontAwesome5 name="chevron-left" size={18} color="#4361ee" />
              </TouchableOpacity>
              <Text style={styles.dateNavText}>{months[reminderMonth]} {reminderYear}</Text>
              <TouchableOpacity onPress={() => { 
                if (reminderMonth === 11) { setReminderMonth(0); setReminderYear(prev => prev + 1); } 
                else { setReminderMonth(prev => prev + 1); } 
              }}>
                <FontAwesome5 name="chevron-right" size={18} color="#4361ee" />
              </TouchableOpacity>
            </View>
            <View style={styles.dayGrid}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <Text key={d} style={styles.dayHeader}>{d}</Text>)}
              {Array.from({ length: new Date(reminderYear, reminderMonth, 1).getDay() }).map((_, i) => <View key={`empty-${i}`} style={styles.dayCell} />)}
              {Array.from({ length: new Date(reminderYear, reminderMonth + 1, 0).getDate() }).map((_, i) => {
                const day = i + 1;
                const isSelected = day === reminderDay;
                return (
                  <TouchableOpacity key={day} style={[styles.dayCell, isSelected && styles.dayCellActive]} onPress={() => setReminderDay(day)}>
                    <Text style={[styles.dayCellText, isSelected && styles.dayCellTextActive]}>{day}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.datePickerActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowDatePicker(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={confirmReminderDate}>
                <Text style={styles.saveBtnText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation */}
      <Modal visible={showDeleteModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContainer}>
            <FontAwesome5 name="trash-alt" size={48} color="#ef4444" style={{ marginBottom: 16 }} />
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 8 }}>Delete Reminder</Text>
            <Text style={{ fontSize: 15, color: '#475569', textAlign: 'center', marginBottom: 20 }}>Are you sure you want to delete &quot;{reminderToDelete?.title}&quot;?</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowDeleteModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmDeleteBtn, deleting && styles.btnDisabled]} onPress={deleteReminder} disabled={deleting}>
                <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>{deleting ? 'Deleting...' : 'Delete'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fbfdff' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  
  filterTabs: { flexDirection: 'row', gap: 6, backgroundColor: '#f1f5f9', padding: 4, borderRadius: 40, marginBottom: 16 },
  filterTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 30 },
  filterTabActive: { backgroundColor: '#FFFFFF', elevation: 2 },
  filterTabText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  filterTabTextActive: { color: '#4361ee' },
  filterCount: { backgroundColor: 'rgba(0,0,0,0.08)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 20, marginLeft: 4 },
  filterCountActive: { backgroundColor: '#4361ee' },
  filterCountText: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  filterCountTextActive: { color: '#FFFFFF' },
  
  actionBar: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f1f5f9', borderRadius: 30, paddingHorizontal: 16, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14, color: '#1e293b' },
  viewToggle: { flexDirection: 'row', gap: 4, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 30, padding: 3 },
  viewToggleBtn: { width: 38, height: 38, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  viewToggleBtnActive: { backgroundColor: '#4361ee' },
  
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, marginTop: 20, paddingBottom: 8, borderBottomWidth: 2 },
  sectionClasses: { borderBottomColor: '#e63946' },
  sectionTasks: { borderBottomColor: '#ffb300' },
  sectionPersonal: { borderBottomColor: '#28a745' },
  sectionTitle: { fontSize: 15, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, flex: 1 },
  sectionCount: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  sectionCountText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  
  remindersList: { gap: 10 },
  remindersGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  
  reminderCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#f0f4fc', borderLeftWidth: 4 },
  reminderCardGrid: { width: '48%', padding: 10 },
  classNow: { borderLeftColor: '#e63946', backgroundColor: '#fff5f5' },
  classUpcoming: { borderLeftColor: '#f72585', backgroundColor: '#fff0f7' },
  classReminder: { borderLeftColor: '#17a2b8' },
  taskReminder: { borderLeftColor: '#ffb300' },
  userReminder: { borderLeftColor: '#28a745' },
  
  reminderCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  reminderTime: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reminderTimeText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  reminderBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeClassNow: { backgroundColor: '#e63946' },
  badgeClassUpcoming: { backgroundColor: '#f72585' },
  badgeClass: { backgroundColor: '#d1ecf1' },
  badgeTask: { backgroundColor: '#fff3cd' },
  badgePersonal: { backgroundColor: '#d4edda' },
  reminderBadgeText: { fontSize: 10, fontWeight: '600' },
  
  reminderCardBody: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  reminderCardBodyGrid: { flexDirection: 'column', gap: 8 },
  reminderIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  reminderContent: { flex: 1 },
  reminderTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  reminderSubtitle: { fontSize: 12, color: '#64748b' },
  taskStatus: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, marginTop: 6, alignSelf: 'flex-start' },
  statusTodo: { backgroundColor: '#fff3cd' },
  statusInProgress: { backgroundColor: '#cce5ff' },
  statusDone: { backgroundColor: '#d4edda' },
  taskStatusText: { fontSize: 10, fontWeight: '600' },
  statusTextTodo: { color: '#856404' },
  statusTextInProgress: { color: '#004085' },
  statusTextDone: { color: '#155724' },
  
  reminderCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  reminderSource: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reminderSourceText: { fontSize: 11, color: '#94a3b8' },
  reminderActions: { flexDirection: 'row', gap: 12 },
  
  emptyState: { alignItems: 'center', paddingVertical: 48, backgroundColor: '#FFFFFF', borderRadius: 28, borderWidth: 1, borderColor: '#f0f4fc', marginTop: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginTop: 16, marginBottom: 8 },
  emptyText: { color: '#64748b', fontSize: 14, textAlign: 'center' },
  
  fab: { position: 'absolute', bottom: 90, right: 20, width: 56, height: 56, borderRadius: 30, backgroundColor: '#4361ee', justifyContent: 'center', alignItems: 'center', elevation: 8, zIndex: 99 },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { backgroundColor: '#FFFFFF', borderRadius: 20, width: '100%', maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e9ecef' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#1e293b' },
  modalBody: { padding: 20 },
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 14, fontWeight: '600', color: '#1e293b', marginBottom: 8 },
  formInput: { borderWidth: 2, borderColor: '#e9ecef', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#1e293b' },
  colorRow: { flexDirection: 'row', gap: 10 },
  colorDot: { width: 36, height: 36, borderRadius: 18, borderWidth: 3, borderColor: 'transparent' },
  colorDotActive: { borderColor: '#1e293b', transform: [{ scale: 1.15 }] },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', padding: 20, borderTopWidth: 1, borderTopColor: '#e9ecef', gap: 10 },
  modalDeleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, marginRight: 'auto' },
  modalDeleteText: { color: '#ef4444', fontWeight: '600', fontSize: 14 },
  cancelBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, backgroundColor: '#f1f5f9' },
  cancelBtnText: { color: '#475569', fontWeight: '600' },
  saveBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, backgroundColor: '#4361ee' },
  saveBtnText: { color: '#FFFFFF', fontWeight: '600' },
  btnDisabled: { opacity: 0.6 },
  deleteModalContainer: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, alignItems: 'center', width: '85%' },
  confirmDeleteBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, backgroundColor: '#ef4444' },
  
  // Date picker
  datePickerBtn: { 
    flexDirection: 'row', alignItems: 'center', gap: 8, 
    borderWidth: 2, borderColor: '#e9ecef', borderRadius: 12, 
    paddingHorizontal: 16, paddingVertical: 12 
  },
  datePickerText: { fontSize: 14, color: '#1e293b', fontWeight: '500' },
  datePickerContainer: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, width: '90%' },
  datePickerTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', textAlign: 'center', marginBottom: 16 },
  dateNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  dateNavText: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  dayHeader: { width: '14.28%', textAlign: 'center', fontSize: 12, fontWeight: '600', color: '#94a3b8', paddingVertical: 8 },
  dayCell: { width: '14.28%', paddingVertical: 10, alignItems: 'center' },
  dayCellActive: { backgroundColor: '#4361ee', borderRadius: 20 },
  dayCellText: { fontSize: 14, fontWeight: '500', color: '#1e293b' },
  dayCellTextActive: { color: '#FFFFFF', fontWeight: '700' },
  datePickerActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },

  // Time picker
  timeSectionLabel: { fontSize: 12, fontWeight: '500', color: '#64748b', marginBottom: 6 },
  timePickerRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  pickerContainer: { flex: 1, height: 150, backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e9ecef', overflow: 'hidden' },
  pickerScroll: { height: 150 },
  pickerItem: { paddingVertical: 12, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  pickerItemActive: { backgroundColor: '#4361ee' },
  pickerItemText: { fontSize: 16, fontWeight: '500', color: '#475569' },
  pickerItemTextActive: { color: '#FFFFFF', fontWeight: '700' },
  timeSeparator: { fontSize: 20, fontWeight: '700', color: '#475569', marginHorizontal: 4 },
  periodContainer: { gap: 4 },
  periodBtn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e9ecef', marginBottom: 4 },
  periodBtnActive: { backgroundColor: '#4361ee', borderColor: '#4361ee' },
  periodText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  periodTextActive: { color: '#FFFFFF' },
  timePreview: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#eef2ff', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, marginTop: 4 },
  timePreviewText: { fontSize: 14, fontWeight: '600', color: '#4361ee' },
});