// app/tasks.tsx
import { FontAwesome5 } from '@expo/vector-icons';
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
  View
} from 'react-native';
import AppHeader from '../components/AppHeader';
import BottomNav from '../components/BottomNav';
import { apiFetch } from '../services/api';

type TaskItem = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'inprogress' | 'done';
  courseId?: string;
  createdAt: string;
  completedAt?: string;
};

export default function TasksScreen() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'todo' | 'inprogress' | 'done'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [saving, setSaving] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Date picker state
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  const [form, setForm] = useState({
    id: '',
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    status: 'todo' as 'todo' | 'inprogress' | 'done',
  });

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

  useEffect(() => {
    loadTasks();
  }, []);

const loadTasks = async () => {
    try {
      const data = await apiFetch('/tasks');
      if (data && data.length > 0) {
        setTasks(data);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

const getFilteredTasks = () => {
    let filtered = [...tasks];
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (filter !== 'all') {
      filtered = filtered.filter(t => t.status === filter);
    }
    
    // Sort: Overdue first → Closest due date → No due date last
    return filtered.sort((a, b) => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      const dateA = a.dueDate ? new Date(a.dueDate) : null;
      const dateB = b.dueDate ? new Date(b.dueDate) : null;
      
      // No due date goes to bottom
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      
      dateA.setHours(0, 0, 0, 0);
      dateB.setHours(0, 0, 0, 0);
      
      const isOverdueA = dateA < now;
      const isOverdueB = dateB < now;
      
      // Both overdue: closest to today first
      if (isOverdueA && isOverdueB) return dateA.getTime() - dateB.getTime();
      // A is overdue, B is not: A first
      if (isOverdueA) return -1;
      // B is overdue, A is not: B first
      if (isOverdueB) return 1;
      
      // Both future: closest due date first
      return dateA.getTime() - dateB.getTime();
    });
  };

  const getActiveTasks = () => getFilteredTasks().filter(t => t.status !== 'done');
  const getCompletedTasks = () => getFilteredTasks().filter(t => t.status === 'done');

  const getTaskCounts = () => ({
    all: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inprogress: tasks.filter(t => t.status === 'inprogress').length,
    done: tasks.filter(t => t.status === 'done').length,
  });

  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate); due.setHours(0, 0, 0, 0);
    return due < today;
  };

  const isToday = (dueDate: string) => {
    if (!dueDate) return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate); due.setHours(0, 0, 0, 0);
    return due.getTime() === today.getTime();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const due = new Date(dateString); due.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0 && date.toDateString() !== today.toDateString()) return 'Yesterday';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const openAddModal = () => {
    setModalMode('add');
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    setForm({ id: '', title: '', description: '', dueDate: tomorrow.toISOString().split('T')[0], priority: 'medium', status: 'todo' });
    setShowModal(true);
  };

  const openEditModal = (task: TaskItem) => {
    setModalMode('edit');
    setForm({
      id: task.id,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate || '',
      priority: task.priority,
      status: task.status,
    });
    setShowModal(true);
  };

  const openDatePicker = () => {
    if (form.dueDate) {
      const d = new Date(form.dueDate);
      setSelectedYear(d.getFullYear());
      setSelectedMonth(d.getMonth());
      setSelectedDay(d.getDate());
    }
    setShowDatePicker(true);
  };

  const confirmDate = () => {
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    setForm(prev => ({ ...prev, dueDate: dateStr }));
    setShowDatePicker(false);
  };

// REPLACE the whole saveTask function:
const saveTask = async () => {
    if (!form.title.trim()) { Alert.alert('Error', 'Task title is required.'); return; }
    setSaving(true);
    try {
      if (modalMode === 'add') {
        const newTask = await apiFetch('/tasks', {
          method: 'POST',
          body: JSON.stringify({
            title: form.title.trim(),
            description: form.description.trim(),
            due_date: form.dueDate,
            priority: form.priority,
            status: form.status,
          }),
        });
        setTasks(prev => [...prev, newTask]);
      } else {
        const updatedTask = await apiFetch(`/tasks/${form.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: form.title.trim(),
            description: form.description.trim(),
            due_date: form.dueDate,
            priority: form.priority,
            status: form.status,
          }),
        });
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
      }
      setShowModal(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save task.');
    } finally { setSaving(false); }
  };

  const confirmDeleteTask = (task: TaskItem) => { setTaskToDelete(task); setShowDeleteModal(true); };
const deleteTask = async () => {
    if (!taskToDelete) return; setDeleting(true);
    try { 
      await apiFetch(`/tasks/${taskToDelete.id}`, { method: 'DELETE' }); 
      setTasks(prev => prev.filter(t => t.id !== taskToDelete.id)); 
      setShowDeleteModal(false); 
      setTaskToDelete(null); 
    }
    catch (error: any) { Alert.alert('Error', error.message || 'Failed to delete task.'); }
    finally { setDeleting(false); }
  };

  const markAsComplete = async (task: TaskItem) => {
    const updatedTask = { ...task, status: 'done' as const, completedAt: new Date().toISOString() };
    try {
      const savedTask = await apiFetch(`/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: updatedTask.title,
          description: updatedTask.description,
          due_date: updatedTask.dueDate,
          priority: updatedTask.priority,
          status: updatedTask.status,
        }),
      });
      setTasks(prev => prev.map(t => t.id === task.id ? { ...updatedTask, ...savedTask } : t));
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to mark task complete.');
    }
  };

  const renderTaskCard = (task: TaskItem) => {
    const overdue = isOverdue(task.dueDate);
    const today = isToday(task.dueDate);
    return (
      <TouchableOpacity key={task.id} style={[
  styles.taskCard,
  viewMode === 'grid' && styles.taskCardGrid,
  task.priority === 'high' && styles.priorityHigh,
  task.priority === 'medium' && styles.priorityMedium,
  task.priority === 'low' && styles.priorityLow,
  task.status === 'done' && styles.taskDone,
  overdue && task.status !== 'done' && styles.taskOverdue,
  today && task.status !== 'done' && !overdue && styles.taskDueToday,
]}>
        <View style={[styles.cardHeader, viewMode === 'grid' && styles.cardHeaderGrid]}>
          <View style={[styles.statusBadge, task.status === 'todo' && styles.statusTodo, task.status === 'inprogress' && styles.statusInProgress, task.status === 'done' && styles.statusDone]}>
            <Text style={[styles.statusText, task.status === 'todo' && styles.statusTextTodo, task.status === 'inprogress' && styles.statusTextInProgress, task.status === 'done' && styles.statusTextDone]}>
              {task.status === 'todo' ? 'To Do' : task.status === 'inprogress' ? 'In Progress' : 'Done'}
            </Text>
          </View>
          <View style={styles.priorityBadge}>
            <FontAwesome5 name="flag" size={10} color={task.priority === 'high' ? '#e63946' : task.priority === 'medium' ? '#ffb300' : '#28a745'} />
            <Text style={[styles.priorityText, task.priority === 'high' && styles.priorityTextHigh, task.priority === 'medium' && styles.priorityTextMedium, task.priority === 'low' && styles.priorityTextLow]}>{task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</Text>
          </View>
        </View>
        <Text 
  style={[
    styles.taskTitle, 
    viewMode === 'grid' && styles.taskTitleGrid,
    task.status === 'done' && styles.taskTitleDone,
  ]} 
  numberOfLines={viewMode === 'grid' ? 2 : 1}
  ellipsizeMode="tail"
>
  {task.title}
</Text>
        {task.description ? (
  <Text 
    style={[
      styles.taskDescription,
      viewMode === 'grid' && styles.taskDescriptionGrid,
    ]} 
    numberOfLines={viewMode === 'grid' ? 2 : 3}
    ellipsizeMode="tail"
  >
    {task.description}
  </Text>
) : null}
        <View style={[styles.cardFooter, viewMode === 'grid' && styles.cardFooterGrid]}>
          <View style={styles.dueDate}>
            <FontAwesome5 name="calendar-alt" size={10} color="#94a3b8" />
            <Text style={styles.dueDateText}> {formatDate(task.dueDate)}</Text>
            {overdue && task.status !== 'done' && <View style={styles.overdueTag}><Text style={styles.overdueTagText}>Overdue</Text></View>}
            {today && task.status !== 'done' && !overdue && <View style={styles.todayTag}><Text style={styles.todayTagText}>Today</Text></View>}
          </View>
<View style={styles.taskActions}>
  {task.status === 'todo' && (
    <TouchableOpacity onPress={() => markAsComplete(task)}>
      <FontAwesome5 name="circle" size={16} color="#94a3b8" />
    </TouchableOpacity>
  )}
  {task.status === 'inprogress' && (
    <TouchableOpacity onPress={() => markAsComplete(task)}>
      <FontAwesome5 name="spinner" size={16} color="#4361ee" />
    </TouchableOpacity>
  )}
  {task.status === 'done' && (
    <FontAwesome5 name="check-circle" size={16} color="#28a745" />
  )}
  <TouchableOpacity onPress={() => openEditModal(task)}>
    <FontAwesome5 name="edit" size={16} color="#94a3b8" />
  </TouchableOpacity>
  <TouchableOpacity onPress={() => confirmDeleteTask(task)}>
    <FontAwesome5 name="trash-alt" size={16} color="#94a3b8" />
  </TouchableOpacity>
</View>
        </View>
        {task.status === 'inprogress' && <View style={styles.progressBar}><View style={[styles.progressFill, { width: '50%' }]} /></View>}
      </TouchableOpacity>
    );
  };

  const counts = getTaskCounts();
  const activeTasks = getActiveTasks();
  const completedTasks = getCompletedTasks();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fbfdff" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <AppHeader title="Tasks" icon="tasks" />

        {/* Stats Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow}>
          {[{ key: 'all', icon: 'tasks', label: 'All', count: counts.all }, { key: 'todo', icon: 'circle', label: 'To Do', count: counts.todo }, { key: 'inprogress', icon: 'spinner', label: 'Progress', count: counts.inprogress }, { key: 'done', icon: 'check-circle', label: 'Done', count: counts.done }].map((item) => (
            <TouchableOpacity key={item.key} style={[styles.statChip, filter === item.key && styles.statChipActive]} onPress={() => setFilter(item.key as any)}>
              <FontAwesome5 name={item.icon} size={14} color={filter === item.key ? '#FFFFFF' : '#64748b'} />
              <Text style={[styles.statLabel, filter === item.key && styles.statLabelActive]}>{item.label}</Text>
              <Text style={[styles.statValue, filter === item.key && styles.statValueActive]}>{item.count}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Search */}
        <View style={styles.actionBar}>
          <View style={styles.searchBox}>
            <FontAwesome5 name="search" size={14} color="#94a3b8" />
            <TextInput style={styles.searchInput} placeholder="Search tasks..." placeholderTextColor="#9aa6b5" value={searchQuery} onChangeText={setSearchQuery} />
          </View>
        </View>

        {/* View Toggle */}
        <View style={styles.viewToggle}>
          <TouchableOpacity style={[styles.viewToggleBtn, viewMode === 'list' && styles.viewToggleBtnActive]} onPress={() => setViewMode('list')}>
            <FontAwesome5 name="list" size={12} color={viewMode === 'list' ? '#FFFFFF' : '#64748b'} />
            <Text style={[styles.viewToggleText, viewMode === 'list' && styles.viewToggleTextActive]}>List</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.viewToggleBtn, viewMode === 'grid' && styles.viewToggleBtnActive]} onPress={() => setViewMode('grid')}>
            <FontAwesome5 name="th-large" size={12} color={viewMode === 'grid' ? '#FFFFFF' : '#64748b'} />
            <Text style={[styles.viewToggleText, viewMode === 'grid' && styles.viewToggleTextActive]}>Grid</Text>
          </TouchableOpacity>
        </View>

        {/* Active Tasks - Only show section when not filtering by done */}
{filter !== 'done' && (
  <>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}><FontAwesome5 name="clock" size={12} color="#64748b" />  ACTIVE</Text>
      <Text style={styles.sectionCount}>{activeTasks.length} tasks</Text>
    </View>
    {activeTasks.length === 0 ? (
      <View style={styles.emptyState}>
        <FontAwesome5 name="clipboard-list" size={56} color="#cbd5e1" />
        <Text style={styles.emptyTitle}>No active tasks</Text>
        <Text style={styles.emptyText}>Tap + to add a new task</Text>
      </View>
    ) : (
      <View style={viewMode === 'grid' ? styles.tasksGrid : styles.tasksList}>
        {activeTasks.map(task => renderTaskCard(task))}
      </View>
    )}
  </>
)}

{/* Completed Tasks - Only show section when filtering by done or showing all */}
{(filter === 'done' || filter === 'all') && completedTasks.length > 0 && (
  <>
    <View style={[styles.sectionHeader, filter !== 'done' && { marginTop: 24 }]}>
      <Text style={styles.sectionTitle}><FontAwesome5 name="check-double" size={12} color="#64748b" />  COMPLETED</Text>
      <Text style={styles.sectionCount}>{completedTasks.length} tasks</Text>
    </View>
    <View style={viewMode === 'grid' ? styles.tasksGrid : styles.tasksList}>
      {completedTasks.map(task => renderTaskCard(task))}
    </View>
  </>
)}

{/* Empty state for done filter */}
{filter === 'done' && completedTasks.length === 0 && (
  <View style={styles.emptyState}>
    <FontAwesome5 name="check-circle" size={56} color="#cbd5e1" />
    <Text style={styles.emptyTitle}>No completed tasks</Text>
    <Text style={styles.emptyText}>Complete a task to see it here</Text>
  </View>
)}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openAddModal} activeOpacity={0.8}><FontAwesome5 name="plus" size={24} color="#FFFFFF" /></TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}><FontAwesome5 name={modalMode === 'add' ? 'plus-circle' : 'edit'} size={18} color="#4361ee" /> {modalMode === 'add' ? 'Create New Task' : 'Edit Task'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}><FontAwesome5 name="times" size={20} color="#64748b" /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Title */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Task Title *</Text>
                <TextInput style={styles.formInput} placeholder="e.g., Complete math assignment" placeholderTextColor="#94a3b8" value={form.title} onChangeText={(text) => setForm(prev => ({ ...prev, title: text }))} />
              </View>
              {/* Description */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput style={[styles.formInput, styles.textArea]} placeholder="Add details about this task..." placeholderTextColor="#94a3b8" value={form.description} onChangeText={(text) => setForm(prev => ({ ...prev, description: text }))} multiline numberOfLines={3} />
              </View>
              {/* Due Date & Priority Row */}
              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Due Date *</Text>
                  <TouchableOpacity style={styles.datePickerBtn} onPress={openDatePicker}>
                    <FontAwesome5 name="calendar-alt" size={14} color="#4361ee" />
                    <Text style={styles.datePickerText}>{form.dueDate ? formatDate(form.dueDate) : 'Select date'}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Priority *</Text>
                  <View style={styles.priorityRow}>
                    {(['high', 'medium', 'low'] as const).map((p) => (
                      <TouchableOpacity key={p} style={[styles.priorityChip, form.priority === p && p === 'high' && styles.priorityChipHigh, form.priority === p && p === 'medium' && styles.priorityChipMedium, form.priority === p && p === 'low' && styles.priorityChipLow]} onPress={() => setForm(prev => ({ ...prev, priority: p }))}>
                        <Text style={[styles.priorityChipText, form.priority === p && { color: '#FFFFFF' }]}>{p.charAt(0).toUpperCase() + p.slice(1)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
              {/* Status */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Status *</Text>
                <View style={styles.statusSelector}>
                  {(['todo', 'inprogress', 'done'] as const).map((s) => (
                    <TouchableOpacity key={s} style={[styles.statusOption, form.status === s && styles.statusOptionActive]} onPress={() => setForm(prev => ({ ...prev, status: s }))}>
                      <Text style={[styles.statusOptionText, form.status === s && { color: '#FFFFFF' }]}>{s === 'todo' ? 'To Do' : s === 'inprogress' ? 'In Progress' : 'Done'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              {modalMode === 'edit' && (
                <TouchableOpacity style={styles.modalDeleteBtn} onPress={() => { setShowModal(false); confirmDeleteTask({ id: form.id, title: form.title, description: form.description, dueDate: form.dueDate, priority: form.priority, status: form.status, createdAt: '', courseId: undefined }); }}>
                  <FontAwesome5 name="trash" size={16} color="#ef4444" /><Text style={styles.modalDeleteText}>Delete</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, saving && styles.btnDisabled]} onPress={saveTask} disabled={saving}>
                <Text style={styles.saveBtnText}>{saving ? 'Saving...' : (modalMode === 'add' ? 'Create Task' : 'Update Task')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <Modal visible={showDatePicker} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerContainer}>
            <Text style={styles.datePickerTitle}>Select Due Date</Text>
            {/* Month/Year Navigation */}
            <View style={styles.dateNav}>
              <TouchableOpacity onPress={() => { if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(prev => prev - 1); } else { setSelectedMonth(prev => prev - 1); } }}>
                <FontAwesome5 name="chevron-left" size={18} color="#4361ee" />
              </TouchableOpacity>
              <Text style={styles.dateNavText}>{months[selectedMonth]} {selectedYear}</Text>
              <TouchableOpacity onPress={() => { if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(prev => prev + 1); } else { setSelectedMonth(prev => prev + 1); } }}>
                <FontAwesome5 name="chevron-right" size={18} color="#4361ee" />
              </TouchableOpacity>
            </View>
            {/* Day Grid */}
            <View style={styles.dayGrid}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <Text key={d} style={styles.dayHeader}>{d}</Text>)}
              {Array.from({ length: new Date(selectedYear, selectedMonth, 1).getDay() }).map((_, i) => <View key={`empty-${i}`} style={styles.dayCell} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isSelected = day === selectedDay;
                return (
                  <TouchableOpacity key={day} style={[styles.dayCell, isSelected && styles.dayCellActive]} onPress={() => setSelectedDay(day)}>
                    <Text style={[styles.dayCellText, isSelected && styles.dayCellTextActive]}>{day}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {/* Actions */}
            <View style={styles.datePickerActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowDatePicker(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={confirmDate}><Text style={styles.saveBtnText}>Confirm</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Modal */}
      <Modal visible={showDeleteModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContainer}>
            <FontAwesome5 name="trash-alt" size={48} color="#ef4444" style={styles.deleteIcon} />
            <Text style={styles.deleteTitle}>Delete Task</Text>
            <Text style={styles.deleteMessage}>Are you sure you want to delete &quot;{taskToDelete?.title}&quot;?</Text>
            <View style={styles.deleteModalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowDeleteModal(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.confirmDeleteBtn, deleting && styles.btnDisabled]} onPress={deleteTask} disabled={deleting}><Text style={styles.confirmDeleteText}>{deleting ? 'Deleting...' : 'Delete'}</Text></TouchableOpacity>
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
  
  // Stats filter chips
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16, paddingBottom: 4 },
  statChip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: '#FFFFFF', 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 40, 
    borderWidth: 1, 
    borderColor: '#eef2f6' 
  },
  statChipActive: { backgroundColor: '#4361ee', borderColor: '#4361ee' },
  statLabel: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  statLabelActive: { color: '#FFFFFF' },
  statValue: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  statValueActive: { color: '#FFFFFF' },
  
  // Search bar
  actionBar: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  searchBox: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    backgroundColor: '#f1f5f9', 
    borderRadius: 30, 
    paddingHorizontal: 16, 
    paddingVertical: 10 
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1e293b' },
  
  // View toggle (List/Grid)
  viewToggle: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  viewToggleBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 6, 
    paddingVertical: 10, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 30, 
    borderWidth: 1, 
    borderColor: '#e2e8f0' 
  },
  viewToggleBtnActive: { backgroundColor: '#4361ee', borderColor: '#4361ee' },
  viewToggleText: { fontSize: 13, fontWeight: '500', color: '#64748b' },
  viewToggleTextActive: { color: '#FFFFFF' },
  
  // Section headers (Active / Completed)
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionCount: { fontSize: 12, color: '#4361ee', fontWeight: '600' },
  
  // Task containers
  tasksList: { gap: 10, marginBottom: 8 },
  tasksGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 10, 
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  
  // ========== TASK CARD (matching HTML design) ==========
  taskCard: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 12, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
    borderTopWidth: 4,
  },
  taskCardGrid: {
    width: '48%',
    padding: 12,
    minHeight: 180,
    justifyContent: 'space-between',
  },
  
  // Priority border-top colors
  priorityHigh: { borderTopColor: '#dc3545' },
  priorityMedium: { borderTopColor: '#ffc107' },
  priorityLow: { borderTopColor: '#28a745' },
  
  // Status-based card backgrounds
  taskDone: { 
    opacity: 0.8, 
    backgroundColor: '#f8f9fa',
  },
  taskOverdue: { 
    backgroundColor: '#f3e5f5',
    borderLeftWidth: 4,
    borderLeftColor: '#9c27b0',
  },
  taskDueToday: { 
    backgroundColor: '#fff9c4',
    borderLeftWidth: 4,
    borderLeftColor: '#ffb300',
  },
  
  // Card header
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  cardHeaderGrid: { marginBottom: 8 },
  
  // Status badges
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusTodo: { backgroundColor: '#fff3cd' },
  statusInProgress: { backgroundColor: '#f8d7da' },
  statusDone: { backgroundColor: '#d4edda' },
  statusText: { fontSize: 11, fontWeight: '600' },
  statusTextTodo: { color: '#856404' },
  statusTextInProgress: { color: '#721c24' },
  statusTextDone: { color: '#155724' },
  
  // Priority badge
  priorityBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priorityText: { fontSize: 11, fontWeight: '600' },
  priorityTextHigh: { color: '#dc3545' },
  priorityTextMedium: { color: '#ffc107' },
  priorityTextLow: { color: '#28a745' },
  
  // Task title
  taskTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 6 },
  taskTitleGrid: { fontSize: 13, marginBottom: 4, maxHeight: 36, overflow: 'hidden' },
  taskTitleDone: { textDecorationLine: 'line-through', color: '#6c757d', fontStyle: 'italic' },
  
  // Task description
  taskDescription: { fontSize: 12, color: '#6c757d', lineHeight: 18, marginBottom: 14 },
  taskDescriptionGrid: { maxHeight: 36, overflow: 'hidden', marginBottom: 8 },
  
  // Card footer
  cardFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f5',
  },
  cardFooterGrid: { flexDirection: 'column', alignItems: 'flex-start', gap: 8 },
  
  // Due date
  dueDate: { flexDirection: 'row', alignItems: 'center' },
  dueDateText: { fontSize: 12, color: '#6c757d' },
  
  // Overdue and Today tags
  overdueTag: { backgroundColor: '#dc3545', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginLeft: 6 },
  overdueTagText: { fontSize: 10, fontWeight: '600', color: '#FFFFFF' },
  todayTag: { backgroundColor: '#ffb300', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginLeft: 6 },
  todayTagText: { fontSize: 10, fontWeight: '600', color: '#212529' },
  
  // Task actions (icons)
  taskActions: { flexDirection: 'row', gap: 8 },
  
  // Progress bar
  progressBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, backgroundColor: '#f1f3f5' },
  progressFill: { height: '100%', backgroundColor: '#4361ee' },
  
  // Empty state
  emptyState: { 
    alignItems: 'center', 
    paddingVertical: 48, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 28, 
    borderWidth: 1, 
    borderColor: '#f0f4fc' 
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginTop: 16, marginBottom: 8 },
  emptyText: { color: '#64748b', fontSize: 14 },
  
  // FAB button
  fab: { 
    position: 'absolute', 
    bottom: 90, 
    right: 20, 
    width: 56, 
    height: 56, 
    borderRadius: 30, 
    backgroundColor: '#4361ee', 
    justifyContent: 'center', 
    alignItems: 'center', 
    shadowColor: '#4361ee', 
    shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 20, 
    elevation: 8, 
    zIndex: 99 
  },
  
  // ========== MODAL STYLES ==========
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  modalContainer: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 20, 
    width: '100%', 
    maxHeight: '85%' 
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#e9ecef' 
  },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#1e293b' },
  modalBody: { padding: 20, maxHeight: 400 },
  
  // Form styles
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 14, fontWeight: '600', color: '#1e293b', marginBottom: 8 },
  formInput: { 
    borderWidth: 2, 
    borderColor: '#e9ecef', 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    fontSize: 15, 
    color: '#1e293b' 
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  formRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  formGroupHalf: { flex: 1 },
  
  // Date picker button
  datePickerBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    borderWidth: 2, 
    borderColor: '#e9ecef', 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    paddingVertical: 12 
  },
  datePickerText: { fontSize: 14, color: '#1e293b', fontWeight: '500' },
  
  // Priority chips
  priorityRow: { flexDirection: 'column', gap: 6 },
  priorityChip: { 
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10, 
    paddingHorizontal: 14, 
    borderRadius: 10, 
    borderWidth: 2, 
    borderColor: '#e9ecef',
  },
  priorityChipHigh: { backgroundColor: '#dc3545', borderColor: '#dc3545' },
  priorityChipMedium: { backgroundColor: '#ffc107', borderColor: '#ffc107' },
  priorityChipLow: { backgroundColor: '#28a745', borderColor: '#28a745' },
  priorityChipText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  
  // Status selector
  statusSelector: { flexDirection: 'row', gap: 8 },
  statusOption: { 
    flex: 1, 
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10, 
    borderRadius: 10, 
    borderWidth: 2, 
    borderColor: '#e9ecef',
  },
  statusOptionActive: { backgroundColor: '#4361ee', borderColor: '#4361ee' },
  statusOptionText: { fontSize: 13, fontWeight: '500', color: '#475569' },
  
  // Date picker modal
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
  
  // Modal footer
  modalFooter: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    alignItems: 'center', 
    padding: 20, 
    borderTopWidth: 1, 
    borderTopColor: '#e9ecef', 
    gap: 10 
  },
  modalDeleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, marginRight: 'auto' },
  modalDeleteText: { color: '#ef4444', fontWeight: '600', fontSize: 14 },
  
  // Buttons
  cancelBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, backgroundColor: '#f1f5f9' },
  cancelBtnText: { color: '#475569', fontWeight: '600' },
  saveBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, backgroundColor: '#4361ee' },
  saveBtnText: { color: '#FFFFFF', fontWeight: '600' },
  btnDisabled: { opacity: 0.6 },
  
  // Delete confirmation modal
  deleteModalContainer: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, alignItems: 'center', width: '85%' },
  deleteIcon: { marginBottom: 16 },
  deleteTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  deleteMessage: { fontSize: 15, color: '#475569', textAlign: 'center', marginBottom: 20 },
  deleteModalFooter: { flexDirection: 'row', gap: 10 },
  confirmDeleteBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, backgroundColor: '#ef4444' },
  confirmDeleteText: { color: '#FFFFFF', fontWeight: '600' },
});