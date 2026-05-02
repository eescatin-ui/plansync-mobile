// app/notes.tsx
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
  View,
} from 'react-native';
import AppHeader from '../components/AppHeader';
import BottomNav from '../components/BottomNav';
import { apiFetch } from '../services/api';

type NoteItem = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  courseId?: string;
  createdAt: string;
  updatedAt: string;
};

export default function NotesScreen() {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [saving, setSaving] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<NoteItem | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    id: '',
    title: '',
    content: '',
    tags: '',
  });

  useEffect(() => {
    loadNotes();
  }, []);

const loadNotes = async () => {
    try {
      const data = await apiFetch('/notes');
      if (data && data.length > 0) {
        setNotes(data);
      }
    } catch (error: any) {
      console.error('Error loading notes:', error.message || error);
    }
  };

  const getFilteredNotes = () => {
    let filtered = [...notes];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(query) ||
        n.content.toLowerCase().includes(query) ||
        n.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    return filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (!content) return '';
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  const openAddModal = () => {
    setModalMode('add');
    setForm({ id: '', title: '', content: '', tags: '' });
    setShowModal(true);
  };

  const openEditModal = (note: NoteItem) => {
    setModalMode('edit');
    setForm({
      id: note.id,
      title: note.title,
      content: note.content,
      tags: note.tags.join(', '),
    });
    setShowModal(true);
  };

const saveNote = async () => {
    if (!form.title.trim()) {
      Alert.alert('Error', 'Note title is required.');
      return;
    }

    setSaving(true);
    const tagsArray = form.tags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    try {
      if (modalMode === 'add') {
        const newNote = await apiFetch('/notes', {
          method: 'POST',
          body: JSON.stringify({
            title: form.title.trim(),
            content: form.content.trim(),
            tags: tagsArray,
          }),
        });
        setNotes(prev => [newNote, ...prev]);
      } else {
        const updatedNote = await apiFetch(`/notes/${form.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: form.title.trim(),
            content: form.content.trim(),
            tags: tagsArray,
          }),
        });
        setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
      }
      setShowModal(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save note.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteNote = (note: NoteItem) => {
    setNoteToDelete(note);
    setShowDeleteModal(true);
  };

const deleteNote = async () => {
    if (!noteToDelete) return;
    setDeleting(true);
    try {
      await apiFetch(`/notes/${noteToDelete.id}`, { method: 'DELETE' });
      setNotes(prev => prev.filter(n => n.id !== noteToDelete.id));
      setShowDeleteModal(false);
      setNoteToDelete(null);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to delete note.');
    } finally {
      setDeleting(false);
    }
  };

  const renderNoteCard = (note: NoteItem) => (
    <TouchableOpacity
      key={note.id}
      style={[styles.noteCard, viewMode === 'grid' && styles.noteCardGrid]}
      onPress={() => openEditModal(note)}
      onLongPress={() => confirmDeleteNote(note)}
    >
      {/* Card Header */}
      <View style={[styles.cardHeader, viewMode === 'grid' && styles.cardHeaderGrid]}>
        <Text style={[styles.noteTitle, viewMode === 'grid' && styles.noteTitleGrid]} numberOfLines={viewMode === 'grid' ? 2 : 1}>
          {note.title}
        </Text>
        <Text style={[styles.noteDate, viewMode === 'grid' && styles.noteDateGrid]}>
          {formatDate(note.createdAt)}
        </Text>
      </View>

      {/* Card Body */}
      <View style={styles.cardBody}>
        <Text style={[styles.noteContent, viewMode === 'grid' && styles.noteContentGrid]} numberOfLines={viewMode === 'grid' ? 2 : 3}>
          {truncateContent(note.content, viewMode === 'grid' ? 80 : 150)}
        </Text>
        {note.tags.length > 0 && (
          <View style={styles.noteTags}>
            {note.tags.slice(0, viewMode === 'grid' ? 2 : 4).map((tag, idx) => (
              <View key={idx} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Card Footer */}
      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => openEditModal(note)}>
          <FontAwesome5 name="edit" size={14} color="#64748b" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={() => confirmDeleteNote(note)}>
          <FontAwesome5 name="trash-alt" size={14} color="#64748b" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const filteredNotes = getFilteredNotes();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fbfdff" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <AppHeader title="Notes" icon="sticky-note" />

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <FontAwesome5 name="sticky-note" size={16} color="#4361ee" />
            <Text style={styles.statLabel}>Total</Text>
            <Text style={styles.statValue}>{notes.length}</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <FontAwesome5 name="search" size={14} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes..."
            placeholderTextColor="#9aa6b5"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* View Toggle */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.viewBtn, viewMode === 'list' && styles.viewBtnActive]}
            onPress={() => setViewMode('list')}
          >
            <FontAwesome5 name="list" size={12} color={viewMode === 'list' ? '#FFFFFF' : '#64748b'} />
            <Text style={[styles.viewBtnText, viewMode === 'list' && styles.viewBtnTextActive]}>List</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewBtn, viewMode === 'grid' && styles.viewBtnActive]}
            onPress={() => setViewMode('grid')}
          >
            <FontAwesome5 name="th-large" size={12} color={viewMode === 'grid' ? '#FFFFFF' : '#64748b'} />
            <Text style={[styles.viewBtnText, viewMode === 'grid' && styles.viewBtnTextActive]}>Grid</Text>
          </TouchableOpacity>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}><FontAwesome5 name="clock" size={12} color="#64748b" />  RECENT</Text>
          <Text style={styles.sectionCount}>{filteredNotes.length} notes</Text>
        </View>

        {/* Notes */}
        {filteredNotes.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome5 name="sticky-note" size={56} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No notes yet</Text>
            <Text style={styles.emptyText}>Start capturing your ideas, lecture notes, and important information.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={openAddModal}>
              <FontAwesome5 name="plus" size={14} color="#FFFFFF" />
              <Text style={styles.emptyBtnText}> Create Your First Note</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={viewMode === 'grid' ? styles.notesGrid : styles.notesList}>
            {filteredNotes.map(note => renderNoteCard(note))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openAddModal} activeOpacity={0.8}>
        <FontAwesome5 name="plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                <FontAwesome5 name={modalMode === 'add' ? 'plus-circle' : 'edit'} size={18} color="#4361ee" />
                {' '}{modalMode === 'add' ? 'Add New Note' : 'Edit Note'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <FontAwesome5 name="times" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Title *</Text>
                <TextInput style={styles.formInput} placeholder="e.g., Lecture Notes" placeholderTextColor="#94a3b8" value={form.title} onChangeText={(text) => setForm(prev => ({ ...prev, title: text }))} />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Content</Text>
                <TextInput style={[styles.formInput, styles.textArea]} placeholder="Write your note content here..." placeholderTextColor="#94a3b8" value={form.content} onChangeText={(text) => setForm(prev => ({ ...prev, content: text }))} multiline numberOfLines={6} />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Tags</Text>
                <TextInput style={styles.formInput} placeholder="e.g., study, exam, important (comma separated)" placeholderTextColor="#94a3b8" value={form.tags} onChangeText={(text) => setForm(prev => ({ ...prev, tags: text }))} />
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              {modalMode === 'edit' && (
                <TouchableOpacity style={styles.modalDeleteBtn} onPress={() => { setShowModal(false); confirmDeleteNote({ id: form.id, title: form.title, content: form.content, tags: form.tags.split(',').map(t => t.trim()).filter(t => t), createdAt: '', updatedAt: '' }); }}>
                  <FontAwesome5 name="trash" size={16} color="#ef4444" />
                  <Text style={styles.modalDeleteText}>Delete</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, saving && styles.btnDisabled]} onPress={saveNote} disabled={saving}>
                <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Note'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Modal */}
      <Modal visible={showDeleteModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContainer}>
            <FontAwesome5 name="trash-alt" size={48} color="#ef4444" style={styles.deleteIcon} />
            <Text style={styles.deleteTitle}>Delete Note</Text>
            <Text style={styles.deleteMessage}>Are you sure you want to delete &quot;{noteToDelete?.title}&quot;?</Text>
            <View style={styles.deleteModalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowDeleteModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmDeleteBtn, deleting && styles.btnDisabled]} onPress={deleteNote} disabled={deleting}>
                <Text style={styles.confirmDeleteText}>{deleting ? 'Deleting...' : 'Delete'}</Text>
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
  
  // Stats
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statChip: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    backgroundColor: '#FFFFFF', 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 40, 
    borderWidth: 1, 
    borderColor: '#eef2f6' 
  },
  statLabel: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  
  // Search
  searchBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    backgroundColor: '#f1f5f9', 
    borderRadius: 30, 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    marginBottom: 16 
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1e293b' },
  
  // View toggle
  viewToggle: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  viewBtn: { 
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
  viewBtnActive: { backgroundColor: '#4361ee', borderColor: '#4361ee' },
  viewBtnText: { fontSize: 13, fontWeight: '500', color: '#64748b' },
  viewBtnTextActive: { color: '#FFFFFF' },
  
  // Section header
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionCount: { fontSize: 12, color: '#4361ee', fontWeight: '600' },
  
  // Notes containers
  notesList: { gap: 12 },
  notesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  
  // Note card
  noteCard: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 20, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: '#f0f4fc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 12,
    elevation: 2,
  },
  noteCardGrid: { width: '48%', padding: 12 },
  
  // Card header
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardHeaderGrid: { flexDirection: 'column', gap: 4 },
  noteTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', lineHeight: 22, flex: 1, paddingRight: 8 },
  noteTitleGrid: { fontSize: 14, lineHeight: 18 },
  noteDate: { fontSize: 11, color: '#94a3b8' },
  noteDateGrid: { fontSize: 10 },
  
  // Card body
  cardBody: { marginBottom: 14 },
  noteContent: { fontSize: 13, color: '#62748c', lineHeight: 20, marginBottom: 10 },
  noteContentGrid: { fontSize: 12, lineHeight: 18 },
  noteTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: '#eef2f6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  tagText: { fontSize: 11, color: '#475569', fontWeight: '500' },
  
  // Card footer
  cardFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  iconBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: '#f8fafc', 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  
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
  emptyText: { color: '#64748b', fontSize: 14, textAlign: 'center', marginBottom: 20, paddingHorizontal: 20 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4361ee', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 30 },
  emptyBtnText: { color: '#FFFFFF', fontWeight: '600' },
  
  // FAB
  fab: { position: 'absolute', bottom: 90, right: 20, width: 56, height: 56, borderRadius: 30, backgroundColor: '#4361ee', justifyContent: 'center', alignItems: 'center', shadowColor: '#4361ee', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8, zIndex: 99 },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { backgroundColor: '#FFFFFF', borderRadius: 20, width: '100%', maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e9ecef' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#1e293b' },
  modalBody: { padding: 20, maxHeight: 400 },
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 14, fontWeight: '600', color: '#1e293b', marginBottom: 8 },
  formInput: { borderWidth: 2, borderColor: '#e9ecef', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#1e293b' },
  textArea: { height: 120, textAlignVertical: 'top' },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', padding: 20, borderTopWidth: 1, borderTopColor: '#e9ecef', gap: 10 },
  modalDeleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, marginRight: 'auto' },
  modalDeleteText: { color: '#ef4444', fontWeight: '600', fontSize: 14 },
  cancelBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, backgroundColor: '#f1f5f9' },
  cancelBtnText: { color: '#475569', fontWeight: '600' },
  saveBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, backgroundColor: '#4361ee' },
  saveBtnText: { color: '#FFFFFF', fontWeight: '600' },
  btnDisabled: { opacity: 0.6 },
  deleteModalContainer: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, alignItems: 'center', width: '85%' },
  deleteIcon: { marginBottom: 16 },
  deleteTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  deleteMessage: { fontSize: 15, color: '#475569', textAlign: 'center', marginBottom: 20 },
  deleteModalFooter: { flexDirection: 'row', gap: 10 },
  confirmDeleteBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, backgroundColor: '#ef4444' },
  confirmDeleteText: { color: '#FFFFFF', fontWeight: '600' },
});