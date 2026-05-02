// app/schedule.tsx
import AppHeader from '@/components/AppHeader';
import { FontAwesome5 } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
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

export default function ScheduleScreen() {
  const [activeView, setActiveView] = useState<'day' | 'week'>('day');
  const [selectedDay, setSelectedDay] = useState(3);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [classToDelete, setClassToDelete] = useState<ClassItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Time picker states
  const [startHour, setStartHour] = useState('9');
  const [startMinute, setStartMinute] = useState('00');
  const [startPeriod, setStartPeriod] = useState('AM');
  const [endHour, setEndHour] = useState('10');
  const [endMinute, setEndMinute] = useState('30');
  const [endPeriod, setEndPeriod] = useState('AM');
  
  const [form, setForm] = useState({
    id: '',
    name: '',
    time: '',
    location: '',
    day: 'Thursday',
    color: '#4361ee',
  });

  const dayScrollViewRef = useRef<ScrollView>(null);
  const weekScrollViewRef = useRef<ScrollView>(null);
  const [classNameSuggestions, setClassNameSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

// Generate current week days with actual dates
const getCurrentWeekDays = () => {
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // Go back to Monday
  
  const daysOfWeekNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const daysOfWeekShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  return daysOfWeekNames.map((dayName, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + mondayOffset + index);
    return {
      name: daysOfWeekShort[index],
      date: String(date.getDate()),
      dayName: dayName,
      isToday: index === (currentDay === 0 ? 6 : currentDay - 1),
    };
  });
};

const days = getCurrentWeekDays();

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
 
const getTodayIndex = () => {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const dayIndex = daysOfWeek.indexOf(today);
  return dayIndex !== -1 ? dayIndex : 3; 
};

const todayIndex = getTodayIndex();

  const allHours = [
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4', value: '4' },
    { label: '5', value: '5' },
    { label: '6', value: '6' },
    { label: '7', value: '7' },
    { label: '8', value: '8' },
    { label: '9', value: '9' },
    { label: '10', value: '10' },
    { label: '11', value: '11' },
    { label: '12', value: '12' },
  ];
  const minutes = ['00', '15', '30', '45'];
  const periods = ['AM', 'PM'];

  const colors = [
    '#4361ee', '#3a0ca3', '#7209b7', '#f72585', '#e63946',
    '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51', '#4cc9f0',
    '#06d6a0', '#118ab2', '#ef476f', '#ffd166', '#8338ec',
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  ];

  useEffect(() => {
    loadClasses();
    setTimeout(() => {
      setSelectedDay(todayIndex);
      dayScrollViewRef.current?.scrollTo({ 
        x: todayIndex * 83 - 120,
        animated: false 
      });
    }, 300);
  }, [todayIndex]);

  useEffect(() => {
    if (activeView === 'week') {
      setTimeout(() => {
        weekScrollViewRef.current?.scrollTo({ 
          x: todayIndex * DAY_COLUMN_WIDTH - 100, 
          animated: true 
        });
      }, 200);
    }
  }, [activeView, todayIndex]);

  const loadClasses = async () => {
    try {
      const data = await apiFetch('/courses');
      if (data && data.length > 0) {
        setClasses(data);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const buildTimeString = () => {
    return `${startHour}:${startMinute} ${startPeriod} - ${endHour}:${endMinute} ${endPeriod}`;
  };

  const parseTimeString = (timeStr: string) => {
    if (!timeStr) return;
    const parts = timeStr.split('-');
    if (parts.length >= 2) {
      const startPart = parts[0].trim();
      const endPart = parts[1].trim();
      const startMatch = startPart.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (startMatch) {
        setStartHour(startMatch[1]);
        setStartMinute(startMatch[2]);
        setStartPeriod(startMatch[3].toUpperCase());
      }
      const endMatch = endPart.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (endMatch) {
        setEndHour(endMatch[1]);
        setEndMinute(endMatch[2]);
        setEndPeriod(endMatch[3].toUpperCase());
      }
    }
  };

  const handleDaySelect = (index: number) => {
    setSelectedDay(index);
    dayScrollViewRef.current?.scrollTo({ x: index * 83 - 60, animated: true });
  };

  // ========== CLASS NAME HELPERS (only ONE declaration of each) ==========
  
  // Get unique class names for suggestions
  const getUniqueClassNames = () => {
    const names = new Set<string>();
    classes.forEach(cls => {
      if (cls.name && cls.name.trim()) {
        names.add(cls.name.trim());
      }
    });
    return Array.from(names).sort();
  };

  // Get color for existing class name
  const getColorForClassName = (name: string) => {
    const existingClass = classes.find(c => 
      c.name.toLowerCase() === name.toLowerCase()
    );
    return existingClass ? existingClass.color : null;
  };

  // Handle class name input - Auto-fill color when typing matches existing class
  const handleClassNameChange = (text: string) => {
    setForm(prev => ({ ...prev, name: text }));
    
    if (text.trim().length > 0) {
      const existingClass = classes.find(c => 
        c.name.toLowerCase() === text.trim().toLowerCase()
      );
      
      if (existingClass) {
        setForm(prev => ({ ...prev, color: existingClass.color }));
      }
      
      const uniqueNames = getUniqueClassNames();
      const filtered = uniqueNames.filter(name => 
        name.toLowerCase().includes(text.toLowerCase())
      );
      setClassNameSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
      setClassNameSuggestions([]);
    }
  };

  // Select suggestion from list
 const selectSuggestion = (name: string) => {
    const existingColor = getColorForClassName(name);
    console.log('Selected:', name, 'Color:', existingColor);
    
    setForm(prev => ({ 
      ...prev, 
      name: name,
      color: existingColor || prev.color
    }));
    
    // Clear suggestions immediately
    setClassNameSuggestions([]);
    setShowSuggestions(false);
  };
  // ========== END CLASS NAME HELPERS ==========

  const switchView = (view: 'day' | 'week') => {
    setActiveView(view);
    if (view === 'week') {
      setSelectedDay(todayIndex);
      setTimeout(() => {
        dayScrollViewRef.current?.scrollTo({ 
          x: todayIndex * 83 - 120,
          animated: true 
        });
      }, 100);
    }
  };

  const CELL_HEIGHT = 55;
  const DAY_COLUMN_WIDTH = 79;


  const timeSlots = [
    { time24: '07:00', display: '7:00 AM', hour: 7 },
    { time24: '08:00', display: '8:00 AM', hour: 8 },
    { time24: '09:00', display: '9:00 AM', hour: 9 },
    { time24: '10:00', display: '10:00 AM', hour: 10 },
    { time24: '11:00', display: '11:00 AM', hour: 11 },
    { time24: '12:00', display: '12:00 PM', hour: 12 },
    { time24: '13:00', display: '1:00 PM', hour: 13 },
    { time24: '14:00', display: '2:00 PM', hour: 14 },
    { time24: '15:00', display: '3:00 PM', hour: 15 },
    { time24: '16:00', display: '4:00 PM', hour: 16 },
    { time24: '17:00', display: '5:00 PM', hour: 17 },
    { time24: '18:00', display: '6:00 PM', hour: 18 },
    { time24: '19:00', display: '7:00 PM', hour: 19 },
    { time24: '20:00', display: '8:00 PM', hour: 20 },
    { time24: '21:00', display: '9:00 PM', hour: 21 },
  ];

  const getClassesForDay = (dayName: string) => {
    if (!classes || classes.length === 0) return [];
    return classes.filter(c => c.day === dayName).sort((a, b) => {
      const timeA = convertTimeToMinutes(a.time);
      const timeB = convertTimeToMinutes(b.time);
      return timeA - timeB;
    });
  };

  const convertTimeToMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const startTime = timeStr.split('-')[0].trim();
    let hours = 0, minutes = 0, isPM = false;
    const ampmMatch = startTime.match(/(am|pm)/i);
    if (ampmMatch) isPM = ampmMatch[1].toLowerCase() === 'pm';
    const timeParts = startTime.replace(/(am|pm)/i, '').trim().split(':');
    hours = parseInt(timeParts[0], 10) || 0;
    minutes = parseInt(timeParts[1], 10) || 0;
    if (isPM && hours < 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  // Get upcoming classes for today only (after current time)
const getUpcomingClasses = () => {
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTotalMinutes = currentHour * 60 + currentMinute;
  
  // Filter classes for today that haven't passed yet
  const upcoming: ClassItem[] = [];
  
  classes.forEach(cls => {
    if (cls.day === currentDay) {
      const classMinutes = convertTimeToMinutes(cls.time);
      if (classMinutes > currentTotalMinutes) {
        upcoming.push(cls);
      }
    }
  });
  
  // Sort by time
  upcoming.sort((a, b) => {
    const timeA = convertTimeToMinutes(a.time);
    const timeB = convertTimeToMinutes(b.time);
    return timeA - timeB;
  });
  
  return upcoming;
};

  const openAddModal = () => {
    setModalMode('add');
    setForm({ id: '', name: '', time: '', location: '', day: 'Thursday', color: '#4361ee' });
    setStartHour('9');
    setStartMinute('00');
    setStartPeriod('AM');
    setEndHour('10');
    setEndMinute('30');
    setEndPeriod('AM');
    setClassNameSuggestions([]);
    setShowSuggestions(false);
    setShowModal(true);
  };

  const openEditModal = (classItem: ClassItem) => {
    setModalMode('edit');
    setForm({
      id: classItem.id,
      name: classItem.name,
      time: classItem.time,
      location: classItem.location,
      day: classItem.day,
      color: classItem.color,
    });
    parseTimeString(classItem.time);
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

const saveClass = async () => {
    if (!form.name.trim() || !form.location.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    setSaving(true);
    const timeString = buildTimeString();
    try {
      if (modalMode === 'add') {
        // Create via API - the API returns the new course with proper UUID
        const newClass = await apiFetch('/courses', {
          method: 'POST',
          body: JSON.stringify({
            name: form.name.trim(),
            time: timeString,
            location: form.location.trim(),
            day: form.day,
            color: form.color,
          }),
        });
        // Use the API response (has correct UUID)
        setClasses(prev => [...prev, newClass]);
        Alert.alert('Success', 'Class added successfully!');
      } else {
        // Update via API using the ID from the API (not local ID)
        const updatedClass = await apiFetch(`/courses/${form.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: form.name.trim(),
            time: timeString,
            location: form.location.trim(),
            day: form.day,
            color: form.color,
          }),
        });
        // Use the API response
        setClasses(prev => prev.map(c => c.id === updatedClass.id ? updatedClass : c));
        Alert.alert('Success', 'Class updated successfully!');
      }
      closeModal();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save class.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteClass = (classItem: ClassItem) => {
    setClassToDelete(classItem);
    setShowDeleteModal(true);
  };

  const deleteClass = async () => {
    if (!classToDelete) return;
    setDeleting(true);
    try {
      await apiFetch(`/courses/${classToDelete.id}`, { method: 'DELETE' });
      setClasses(prev => prev.filter(c => c.id !== classToDelete.id));
      Alert.alert('Success', 'Class deleted successfully!');
      setShowDeleteModal(false);
      setClassToDelete(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete class.');
    } finally {
      setDeleting(false);
    }
  };

  const getClassTimeInfo = (timeStr: string) => {
    if (!timeStr) return { topOffset: 0, height: CELL_HEIGHT };
    const parts = timeStr.split('-');
    if (parts.length >= 2) {
      const startMinutes = convertTimeToMinutes(parts[0].trim());
      const endMinutes = convertTimeToMinutes(parts[1].trim());
      const dayStartMinutes = 7 * 60;
      return {
        topOffset: ((startMinutes - dayStartMinutes) / 60) * CELL_HEIGHT,
        height: ((endMinutes - startMinutes) / 60) * CELL_HEIGHT,
      };
    }
    return { topOffset: 0, height: CELL_HEIGHT };
  };

  const weekDayHeaders = days.map(d => ({ name: d.name, date: d.date }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fbfdff" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
<AppHeader title="Schedule" icon="calendar-week" />

        {/* Week Navigator */}
        <View style={styles.weekNavigator}>
          <TouchableOpacity style={styles.weekNavBtn}>
            <FontAwesome5 name="chevron-left" size={16} color="#475569" />
          </TouchableOpacity>
          <Text style={styles.weekRange}>
            Apr 6 - Apr 12, <Text style={styles.weekYear}>2026</Text>
          </Text>
          <TouchableOpacity style={styles.weekNavBtn}>
            <FontAwesome5 name="chevron-right" size={16} color="#475569" />
          </TouchableOpacity>
        </View>

        {/* Day Tabs */}
        <View style={styles.dayTabsWrapper}>
          <ScrollView 
            ref={dayScrollViewRef}
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.dayTabs}
          >
            {days.map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayTab,
                  selectedDay === index && styles.dayTabActive,
                  index === todayIndex && styles.dayTabToday,
                ]}
                onPress={() => handleDaySelect(index)}
              >
                <Text style={[
                  styles.dayName,
                  index === todayIndex && styles.dayNameToday,
                  selectedDay === index && styles.dayNameActive,
                ]}>
                  {day.name}
                </Text>
                <Text style={[
                  styles.dayDate,
                  index === todayIndex && styles.dayDateToday,
                  selectedDay === index && styles.dayDateActive,
                ]}>
                  {day.date}
                </Text>
                {index === todayIndex && (
                  <View style={[styles.todayBadge, selectedDay === index && styles.todayBadgeActive]}>
                    <Text style={[styles.todayBadgeText, selectedDay === index && styles.todayBadgeTextActive]}>
                      TODAY
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.swipeHint}>
            {[0, 1, 2, 3, 4].map((dot, i) => (
              <View key={i} style={[styles.swipeDot, i === 2 && styles.swipeDotActive]} />
            ))}
          </View>
        </View>

 {/* Stats and View Toggle Row */}
<View style={styles.statsToggleRow}>
  {/* Left side - Class counts */}
  <View style={styles.countsContainer}>
    <View style={styles.countBadge}>
      <FontAwesome5 name="book" size={12} color="#4361ee" />
      <Text style={styles.countNumber}>{classes.length}</Text>
      <Text style={styles.countLabel}>Total</Text>
    </View>
    <View style={styles.countBadge}>
      <FontAwesome5 name="sun" size={12} color="#f59e0b" />
      <Text style={styles.countNumber}>{getClassesForDay(days[todayIndex].dayName).length}</Text>
      <Text style={styles.countLabel}>Today</Text>
    </View>
  </View>

  {/* Right side - View Toggle */}
  <View style={styles.viewToggleRow}>
    <TouchableOpacity
      style={[styles.viewToggleBtn, activeView === 'day' && styles.viewToggleBtnActive]}
      onPress={() => switchView('day')}
    >
      <FontAwesome5 name="calendar-day" size={12} color={activeView === 'day' ? '#FFFFFF' : '#64748b'} />
      <Text style={[styles.viewToggleText, activeView === 'day' && styles.viewToggleTextActive]}>Day</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.viewToggleBtn, activeView === 'week' && styles.viewToggleBtnActive]}
      onPress={() => switchView('week')}
    >
      <FontAwesome5 name="calendar-alt" size={12} color={activeView === 'week' ? '#FFFFFF' : '#64748b'} />
      <Text style={[styles.viewToggleText, activeView === 'week' && styles.viewToggleTextActive]}>Week</Text>
    </TouchableOpacity>
  </View>
</View>

        {/* Day View */}
        {activeView === 'day' && (
          <View style={styles.scheduleContent}>
            <View style={styles.scheduleTimeline}>
              <View style={styles.timelineHeader}>
                <Text style={styles.timelineTitle}>
                  <FontAwesome5 name="calendar-alt" size={14} color="#1e293b" />  {days[selectedDay].dayName}, April {days[selectedDay].date}
                </Text>
                <Text style={styles.timelineCount}>
                  <FontAwesome5 name="clock" size={12} color="#4361ee" />  {getClassesForDay(days[selectedDay].dayName).length} classes
                </Text>
              </View>

              {getClassesForDay(days[selectedDay].dayName).map((classItem) => (
                <View key={classItem.id} style={styles.classBlock}>
                  <View style={styles.timeIndicatorContainer}>
                    <Text style={styles.timeIndicatorStart}>{classItem.time.split('-')[0]?.trim()}</Text>
                    <View style={styles.timeLine} />
                    <Text style={styles.timeIndicatorEnd}>{classItem.time.split('-')[1]?.trim()}</Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.classCard, { borderLeftColor: classItem.color, backgroundColor: classItem.color + '10' }]}
                    activeOpacity={0.7}
                    onPress={() => openEditModal(classItem)}
                    onLongPress={() => confirmDeleteClass(classItem)}
                  >
                    <Text style={styles.classTitle}>{classItem.name}</Text>
                    <View style={styles.classDetails}>
                      <View style={styles.classDetail}>
                        <FontAwesome5 name="map-marker-alt" size={10} color="#8c9eb5" />
                        <Text style={styles.classDetailText}> {classItem.location}</Text>
                      </View>
                      <View style={[styles.classTypeBadge, { backgroundColor: classItem.color + '20' }]}>
                        <Text style={[styles.classTypeText, { color: classItem.color }]}>Class</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
              {getClassesForDay(days[selectedDay].dayName).length === 0 && (
                <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                  <FontAwesome5 name="calendar-day" size={40} color="#cbd5e1" />
                  <Text style={{ color: '#94a3b8', marginTop: 12, marginBottom: 16 }}>No classes scheduled</Text>
                </View>
              )}
            </View>
          </View>
        )}

        

        {/* Week View */}
        {activeView === 'week' && (
          <View style={styles.scheduleContent}>
            <View style={styles.weekGrid}>
              <View style={styles.weekGridRow}>
                <View style={styles.fixedTimeColumn}>
                  <View style={styles.timeColumnHeader} />
                  {timeSlots.map((slot, index) => (
                    <View key={index} style={[styles.timeSlotCell, { height: CELL_HEIGHT }]}>
                      <Text style={styles.timeSlotText}>{slot.display}</Text>
                    </View>
                  ))}
                </View>

<ScrollView 
    horizontal 
    showsHorizontalScrollIndicator={false} 
    style={styles.scrollableDays} 
    ref={weekScrollViewRef}
    onLayout={() => {
        setTimeout(() => {
            weekScrollViewRef.current?.scrollTo({ 
                x: todayIndex * DAY_COLUMN_WIDTH - 100, 
                animated: true 
            });
        }, 100);
    }}
>
                  <View>
                    <View style={styles.weekHeader}>
                      {weekDayHeaders.map((day, index) => (
                        <View key={index} style={[styles.dayColumnHeader, index === todayIndex && styles.todayHeader]}>
                          <Text style={[styles.dayColumnText, index === todayIndex && styles.todayHeaderText]}>
                            {day.name} {day.date}
                          </Text>
                        </View>
                      ))}
                    </View>

                    <View style={{ position: 'relative', height: timeSlots.length * CELL_HEIGHT }}>
                      <View style={{
                        position: 'absolute', left: todayIndex * DAY_COLUMN_WIDTH, top: 0,
                        width: DAY_COLUMN_WIDTH, height: '100%',
                        backgroundColor: 'rgba(254, 240, 138, 0.2)', borderRadius: 8,
                      }} />

                      {timeSlots.map((slot, rowIndex) => (
                        <View key={rowIndex} style={styles.weekRow}>
                          {weekDayHeaders.map((day, dayIndex) => (
                            <View key={dayIndex} style={styles.weekCell} />
                          ))}
                        </View>
                      ))}

                      {days.map((day, dayIndex) => {
                        const dayClasses = getClassesForDay(day.dayName);
                        return dayClasses.map((cls) => {
                          const { topOffset, height } = getClassTimeInfo(cls.time);
                          return (
                            <TouchableOpacity
                              key={cls.id}
                              style={[styles.classBlockOverlay, {
                                left: dayIndex * DAY_COLUMN_WIDTH + 2,
                                top: topOffset,
                                height: Math.max(height - 2, 25),
                                backgroundColor: cls.color,
                              }]}
                              onPress={() => openEditModal(cls)}
                              onLongPress={() => confirmDeleteClass(cls)}
                            >
                              <Text style={styles.blockClassTitle} numberOfLines={1}>{cls.name}</Text>
                              <Text style={styles.blockClassTime} numberOfLines={1}>{cls.time}</Text>
                              <Text style={styles.blockClassLoc} numberOfLines={1}>{cls.location}</Text>
                            </TouchableOpacity>
                          );
                        });
                      })}
                    </View>
                  </View>
                </ScrollView>
              </View>
            </View>
          </View>
        )}

{/* Upcoming Classes Summary - Today Only */}
<View style={styles.summarySection}>
  <View style={styles.summaryHeader}>
    <Text style={styles.summaryTitle}>
      <FontAwesome5 name="forward" size={14} color="#1e293b" />  Coming up next
    </Text>
    <TouchableOpacity>
      <Text style={styles.sectionLink}>Today</Text>
    </TouchableOpacity>
  </View>
  <View style={styles.summaryCard}>
    {/* Call getUpcomingClasses once and store result */}
    {(() => {
      const upcomingClasses = getUpcomingClasses();
      
      if (classes.length === 0) {
        return <Text style={{ color: '#94a3b8', textAlign: 'center', paddingVertical: 16 }}>Add classes to see them here</Text>;
      }
      
      if (upcomingClasses.length === 0) {
        return <Text style={{ color: '#94a3b8', textAlign: 'center', paddingVertical: 16 }}>No more classes today</Text>;
      }
      
      return upcomingClasses.slice(0, 4).map((item, index) => (
        <TouchableOpacity 
          key={item.id} 
          style={[styles.summaryItem, index < Math.min(upcomingClasses.length, 4) - 1 && styles.summaryItemBorder]}
          activeOpacity={0.7}
          onPress={() => openEditModal(item)}
        >
          <View style={styles.summaryTime}>
            <Text style={styles.summaryTimeText}>{item.time}</Text>
          </View>
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryItemTitle}>{item.name}</Text>
            <Text style={styles.summaryMeta}>{item.location}</Text>
          </View>
          <View style={[styles.colorDotSmall, { backgroundColor: item.color }]} />
        </TouchableOpacity>
      ));
    })()}
  </View>
</View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB Add Class */}
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
                {' '}{modalMode === 'add' ? 'Add New Class' : 'Edit Class'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <FontAwesome5 name="times" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView 
  style={styles.modalBody} 
  showsVerticalScrollIndicator={false}
  nestedScrollEnabled={true}
>
{/* Class Name with Auto-Color */}
<View style={styles.formGroup}>
  <Text style={styles.formLabel}>Class Name *</Text>
  <TextInput 
    style={styles.formInput} 
    placeholder="e.g., Mathematics" 
    placeholderTextColor="#94a3b8" 
    value={form.name} 
    onChangeText={handleClassNameChange}
    onFocus={() => {
      if (form.name.trim().length > 0) {
        const uniqueNames = getUniqueClassNames();
        const filtered = uniqueNames.filter(name => 
          name.toLowerCase().includes(form.name.toLowerCase())
        );
        if (filtered.length > 0) {
          setClassNameSuggestions(filtered);
          setShowSuggestions(true);
        }
      }
    }}
    autoCapitalize="words"
  />
  
 {showSuggestions && classNameSuggestions.length > 0 && (
    <View style={styles.suggestionsContainer}>
      <ScrollView 
        style={styles.suggestionsList} 
        nestedScrollEnabled={true} 
        keyboardShouldPersistTaps="always"
      >
        {classNameSuggestions.map((name, index) => {
          const existingColor = getColorForClassName(name);
          return (
            <TouchableOpacity
              key={`suggest-${index}`}
              style={styles.suggestionItem}
              onPress={() => selectSuggestion(name)}
              activeOpacity={0.7}
            >
              <View style={[styles.suggestionColorDot, { backgroundColor: existingColor || '#94a3b8' }]} />
              <Text style={styles.suggestionText}>{name}</Text>
              {existingColor && (
                <View style={styles.inheritBadge}>
                  <Text style={styles.inheritBadgeText}>color ✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  )}

  
  {/* Show when color is inherited */}
  {form.name.trim() && getColorForClassName(form.name.trim()) && (
    <View style={styles.inheritNotice}>
      <FontAwesome5 name="palette" size={10} color="#4361ee" />
      <Text style={styles.inheritNoticeText}>
        Color auto-assigned from existing class
      </Text>
    </View>
  )}
</View>

{/* Time Pickers */}
<View style={styles.formGroup}>
  <Text style={styles.formLabel}>Time *</Text>
  
  {/* Start Time */}
  <Text style={styles.timeSectionLabel}>Start Time</Text>
  <View style={styles.timePickerRow}>
    {/* Hour Scroll */}
    <View style={styles.pickerContainer}>
      <ScrollView 
        style={styles.pickerScroll} 
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {allHours.map((h, index) => (
  <TouchableOpacity
    key={`sh-${index}`}
    style={[styles.pickerItem, startHour === h.value && styles.pickerItemActive]}
    onPress={() => setStartHour(h.value)}
  >
    <Text style={[styles.pickerItemText, startHour === h.value && styles.pickerItemTextActive]}>{h.label}</Text>
  </TouchableOpacity>
))}
      </ScrollView>
    </View>
    <Text style={styles.timeSeparator}>:</Text>
    {/* Minute Scroll */}
    <View style={styles.pickerContainer}>
      <ScrollView 
        style={styles.pickerScroll} 
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
{minutes.map((m, index) => (
  <TouchableOpacity
    key={`sm-${index}`}
            style={[styles.pickerItem, startMinute === m && styles.pickerItemActive]}
            onPress={() => setStartMinute(m)}
          >
            <Text style={[styles.pickerItemText, startMinute === m && styles.pickerItemTextActive]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
    {/* AM/PM */}
    <View style={styles.periodContainer}>
      {periods.map((p) => (
        <TouchableOpacity
          key={`sp-${p}`}
          style={[styles.periodBtn, startPeriod === p && styles.periodBtnActive]}
          onPress={() => setStartPeriod(p)}
        >
          <Text style={[styles.periodText, startPeriod === p && styles.periodTextActive]}>{p}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>

  {/* End Time */}
  <Text style={[styles.timeSectionLabel, { marginTop: 12 }]}>End Time</Text>
  <View style={styles.timePickerRow}>
    {/* Hour Scroll */}
    <View style={styles.pickerContainer}>
      <ScrollView 
        style={styles.pickerScroll} 
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {allHours.map((h, index) => (
  <TouchableOpacity
    key={`eh-${index}`}
    style={[styles.pickerItem, endHour === h.value && styles.pickerItemActive]}
    onPress={() => setEndHour(h.value)}
  >
    <Text style={[styles.pickerItemText, endHour === h.value && styles.pickerItemTextActive]}>{h.label}</Text>
  </TouchableOpacity>
))}
      </ScrollView>
    </View>
    <Text style={styles.timeSeparator}>:</Text>
    {/* Minute Scroll */}
    <View style={styles.pickerContainer}>
      <ScrollView 
        style={styles.pickerScroll} 
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
{minutes.map((m, index) => (
  <TouchableOpacity
    key={`em-${index}`}
            style={[styles.pickerItem, endMinute === m && styles.pickerItemActive]}
            onPress={() => setEndMinute(m)}
          >
            <Text style={[styles.pickerItemText, endMinute === m && styles.pickerItemTextActive]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
    {/* AM/PM */}
    <View style={styles.periodContainer}>
      {periods.map((p) => (
        <TouchableOpacity
          key={`ep-${p}`}
          style={[styles.periodBtn, endPeriod === p && styles.periodBtnActive]}
          onPress={() => setEndPeriod(p)}
        >
          <Text style={[styles.periodText, endPeriod === p && styles.periodTextActive]}>{p}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>

  {/* Time Preview */}
  <View style={styles.timePreview}>
    <FontAwesome5 name="clock" size={12} color="#4361ee" />
    <Text style={styles.timePreviewText}>{buildTimeString()}</Text>
  </View>
</View>

              {/* Location */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Location *</Text>
                <TextInput style={styles.formInput} placeholder="e.g., Room 302" placeholderTextColor="#94a3b8" value={form.location} onChangeText={(text) => setForm(prev => ({ ...prev, location: text }))} />
              </View>

              {/* Day Selection */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Day *</Text>
                <View style={styles.daySelector}>
                  {daysOfWeek.map((day) => (
                    <TouchableOpacity key={day} style={[styles.dayOption, form.day === day && styles.dayOptionActive]} onPress={() => setForm(prev => ({ ...prev, day }))}>
                      <Text style={[styles.dayOptionText, form.day === day && styles.dayOptionTextActive]}>{day.substring(0, 3)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Color Picker */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Color</Text>
                <View style={styles.colorPalette}>
                  {colors.map((color) => (
                    <TouchableOpacity key={color} style={[styles.colorSwatch, { backgroundColor: color }, form.color === color && styles.colorSwatchActive]} onPress={() => setForm(prev => ({ ...prev, color }))} />
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              {modalMode === 'edit' && (
                <TouchableOpacity style={styles.deleteBtn} onPress={() => { closeModal(); confirmDeleteClass({ id: form.id, name: form.name, time: buildTimeString(), location: form.location, day: form.day, color: form.color }); }}>
                  <FontAwesome5 name="trash" size={16} color="#ef4444" />
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, saving && styles.btnDisabled]} onPress={saveClass} disabled={saving}>
                <FontAwesome5 name={modalMode === 'add' ? 'plus' : 'save'} size={14} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>{saving ? 'Saving...' : (modalMode === 'add' ? 'Add Class' : 'Update')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContainer}>
            <FontAwesome5 name="trash-alt" size={48} color="#ef4444" style={styles.deleteIcon} />
            <Text style={styles.deleteTitle}>Delete Class</Text>
            <Text style={styles.deleteMessage}>Are you sure you want to delete &quot;{classToDelete?.name}&quot;?</Text>
            <Text style={styles.deleteWarning}>This action cannot be undone.</Text>
            <View style={styles.deleteModalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowDeleteModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmDeleteBtn, deleting && styles.btnDisabled]} onPress={deleteClass} disabled={deleting}>
                <Text style={styles.confirmDeleteText}>{deleting ? 'Deleting...' : 'Yes, Delete'}</Text>
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
  pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 8 },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerText: { fontSize: 24, fontWeight: '700', color: '#1e293b' },
  viewToggle: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 30, padding: 3, gap: 2 },
  viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 30 },
  viewBtnActive: { backgroundColor: '#4361ee' },
  viewBtnText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  viewBtnTextActive: { color: '#FFFFFF' },
  weekNavigator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 40, borderWidth: 1, borderColor: '#eef2f6', marginBottom: 20 },
  weekNavBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  weekRange: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  weekYear: { color: '#4361ee' },
  dayTabsWrapper: { marginBottom: 20 },
  dayTabs: { paddingBottom: 8 },
  dayTab: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#e4eaf2', borderRadius: 30, alignItems: 'center', marginRight: 8, minWidth: 75 },
  dayTabActive: { backgroundColor: '#4361ee', borderColor: '#4361ee' },
  dayTabToday: { borderWidth: 2, borderColor: '#4361ee' },
  dayName: { fontSize: 13, fontWeight: '500', color: '#64748b', marginBottom: 2 },
  dayNameToday: { color: '#4361ee', fontWeight: '700' },
  dayNameActive: { color: '#FFFFFF' },
  dayDate: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  dayDateToday: { color: '#4361ee' },
  dayDateActive: { color: '#FFFFFF' },
  todayBadge: { backgroundColor: 'rgba(67, 97, 238, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 20, marginTop: 3 },
  todayBadgeActive: { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  todayBadgeText: { fontSize: 10, fontWeight: '600', color: '#4361ee' },
  todayBadgeTextActive: { color: '#FFFFFF' },
  swipeHint: { flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 6 },
  swipeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#cbd5e1' },
  swipeDotActive: { width: 16, backgroundColor: '#4361ee' },
  scheduleContent: { marginBottom: 20 },
  scheduleTimeline: { backgroundColor: '#FFFFFF', borderRadius: 28, padding: 16, borderWidth: 1, borderColor: '#f0f4fc' },
  timelineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
  timelineTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  timelineCount: { fontSize: 13, color: '#4361ee', fontWeight: '600' },
  classBlock: { flexDirection: 'row', marginBottom: 16 },
  timeIndicatorContainer: { width: 70, alignItems: 'center' },
  timeIndicatorStart: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  timeLine: { width: 1, flex: 1, backgroundColor: '#e2e8f0', marginVertical: 2 },
  timeIndicatorEnd: { fontSize: 10, fontWeight: '500', color: '#94a3b8' },
  classCard: { flex: 1, borderRadius: 16, padding: 14, borderLeftWidth: 4, marginLeft: 8 },
  classTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 6 },
  classDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center' },
  classDetail: { flexDirection: 'row', alignItems: 'center' },
  classDetailText: { fontSize: 11, color: '#62748c' },
  classTypeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  classTypeText: { fontSize: 10, fontWeight: '600' },
  weekGrid: { backgroundColor: '#FFFFFF', borderRadius: 28, padding: 12, borderWidth: 1, borderColor: '#f0f4fc', overflow: 'hidden' },
  weekGridRow: { flexDirection: 'row' },
  fixedTimeColumn: { width: 60, zIndex: 2, backgroundColor: '#FFFFFF' },
  scrollableDays: { flex: 1 },
  timeColumnHeader: { height: 44 },
  weekHeader: { flexDirection: 'row', height: 44, alignItems: 'center' },
  dayColumnHeader: { width: 75, height: 44, paddingVertical: 4, paddingHorizontal: 2, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginHorizontal: 2 },
  todayHeader: { backgroundColor: '#eef2ff' },
  dayColumnText: { fontSize: 10, fontWeight: '600', color: '#475569', textAlign: 'center' },
  todayHeaderText: { color: '#4361ee' },
  timeSlotCell: { justifyContent: 'flex-start', paddingTop: 4, paddingRight: 10 },
  timeSlotText: { fontSize: 10, color: '#94a3b8', textAlign: 'center', fontWeight: '500' },
  weekRow: { flexDirection: 'row', height: 55 },
  weekCell: { width: 75, backgroundColor: '#f8fafc', borderRadius: 8, marginHorizontal: 2, marginVertical: 1, borderWidth: 1, borderColor: '#f1f5f9' },
  classBlockOverlay: { position: 'absolute', width: 75, borderRadius: 8, padding: 5, zIndex: 1, justifyContent: 'center', alignItems: 'flex-start', overflow: 'hidden' },
  blockClassTitle: { fontSize: 9, fontWeight: '700', color: '#FFFFFF', marginBottom: 1 },
  blockClassTime: { fontSize: 7, fontWeight: '500', color: 'rgba(255,255,255,0.95)', marginBottom: 1 },
  blockClassLoc: { fontSize: 8, color: 'rgba(255,255,255,0.85)' },
  summarySection: { marginTop: 8 },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  sectionLink: { fontSize: 13, fontWeight: '600', color: '#4361ee' },
  summaryCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#f0f4fc' },
  summaryItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  summaryItemBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  summaryTime: { backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  summaryTimeText: { fontSize: 11, fontWeight: '600', color: '#4361ee' },
  summaryInfo: { flex: 1 },
  summaryItemTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 2 },
  summaryMeta: { fontSize: 11, color: '#62748c' },
  colorDotSmall: { width: 8, height: 8, borderRadius: 4 },
  fab: { position: 'absolute', bottom: 90, right: 20, width: 56, height: 56, borderRadius: 30, backgroundColor: '#4361ee', justifyContent: 'center', alignItems: 'center', shadowColor: '#4361ee', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8, zIndex: 99 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { backgroundColor: '#FFFFFF', borderRadius: 20, width: '100%', maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e9ecef' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#1e293b' },
  modalBody: { padding: 20, maxHeight: 400 },
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 14, fontWeight: '600', color: '#1e293b', marginBottom: 8 },
  formInput: { borderWidth: 2, borderColor: '#e9ecef', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#1e293b' },
  // Time picker styles
  timeSectionLabel: { fontSize: 12, fontWeight: '500', color: '#64748b', marginBottom: 6 },
  timePickerRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  pickerContainer: { flex: 1, maxHeight: 150, backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e9ecef', overflow: 'hidden' },
  pickerScroll: { maxHeight: 150 },
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
  // Day selector
  daySelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dayOption: { flex: 1, minWidth: 55, paddingVertical: 10, borderRadius: 10, borderWidth: 2, borderColor: '#e9ecef', alignItems: 'center' },
  dayOptionActive: { backgroundColor: '#4361ee', borderColor: '#4361ee' },
  dayOptionText: { fontSize: 13, fontWeight: '500', color: '#475569' },
  dayOptionTextActive: { color: '#FFFFFF' },
  colorPalette: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colorSwatch: { width: 36, height: 36, borderRadius: 8, borderWidth: 2, borderColor: 'transparent' },
  colorSwatchActive: { borderColor: '#1e293b', transform: [{ scale: 1.1 }] },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', padding: 20, borderTopWidth: 1, borderTopColor: '#e9ecef', gap: 10 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, marginRight: 'auto' },
  deleteBtnText: { color: '#ef4444', fontWeight: '600', fontSize: 14 },
  cancelBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, backgroundColor: '#f1f5f9' },
  cancelBtnText: { color: '#475569', fontWeight: '600' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, backgroundColor: '#4361ee' },
  saveBtnText: { color: '#FFFFFF', fontWeight: '600' },
  btnDisabled: { opacity: 0.6 },
  deleteModalContainer: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, alignItems: 'center', width: '85%' },
  deleteIcon: { marginBottom: 16 },
  deleteTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  deleteMessage: { fontSize: 15, color: '#475569', textAlign: 'center', marginBottom: 8 },
  deleteWarning: { fontSize: 13, color: '#ef4444', marginBottom: 20 },
  deleteModalFooter: { flexDirection: 'row', gap: 10 },
  confirmDeleteBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, backgroundColor: '#ef4444' },
  confirmDeleteText: { color: '#FFFFFF', fontWeight: '600' },
  // Stats and toggle row
statsToggleRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 16,
},
countsContainer: {
  flexDirection: 'row',
  gap: 2,
},
countBadge: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 5,
  backgroundColor: '#FFFFFF',
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: 20,
  borderWidth: 1,
  borderColor: '#eef2f6',
},
countNumber: {
  fontSize: 14,
  fontWeight: '700',
  color: '#1e293b',
},
countLabel: {
  fontSize: 11,
  fontWeight: '500',
  color: '#64748b',
},
viewToggleRow: {
  flexDirection: 'row',
  backgroundColor: '#f1f5f9',
  borderRadius: 30,
  padding: 3,
  gap: 2,
},
viewToggleBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 5,
  paddingHorizontal: 12,
  paddingVertical: 7,
  borderRadius: 30,
},
viewToggleBtnActive: {
  backgroundColor: '#4361ee',
},
viewToggleText: {
  fontSize: 12,
  fontWeight: '600',
  color: '#64748b',
},
viewToggleTextActive: {
  color: '#FFFFFF',
},
  viewToggleContainer: {
  alignItems: 'flex-end',
  marginBottom: 16,
},

// Suggestions dropdown styles
suggestionsList: {
  maxHeight: 150,
},
suggestionItem: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 14,
  paddingVertical: 12,
  borderBottomWidth: 1,
  borderBottomColor: '#f1f5f9',
  gap: 10,
},
suggestionColor: {
  width: 14,
  height: 14,
  borderRadius: 4,
},
suggestionText: {
  flex: 1,
  fontSize: 14,
  fontWeight: '500',
  color: '#1e293b',
},
suggestionInherit: {
  fontSize: 10,
  color: '#4361ee',
  fontWeight: '500',
  fontStyle: 'italic',
},

// Suggestions dropdown styles
suggestionsContainer: {
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#e9ecef',
  marginTop: 4,
  overflow: 'hidden',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 5,
},
suggestionColorDot: {
  width: 14,
  height: 14,
  borderRadius: 4,
},
inheritBadge: {
  backgroundColor: '#eef2ff',
  paddingHorizontal: 6,
  paddingVertical: 2,
  borderRadius: 8,
},
inheritBadgeText: {
  fontSize: 9,
  color: '#4361ee',
  fontWeight: '600',
},
inheritNotice: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  marginTop: 6,
  paddingHorizontal: 4,
},
inheritNoticeText: {
  fontSize: 11,
  color: '#4361ee',
  fontStyle: 'italic',
},


});