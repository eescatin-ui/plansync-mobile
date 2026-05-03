// app/schedule.tsx
// app/schedule.tsx
import { FontAwesome5 } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert, Modal, ScrollView, StatusBar, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useData } from '../contexts/DataContext';
import { apiFetch } from '../services/api';

type ClassItem = {
  id: string; name: string; time: string; location: string; day: string; color: string;
};

export default function ScheduleScreen() {
  const [activeView, setActiveView] = useState<'day' | 'week'>('day');
  const { classes, refreshData } = useData();
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [classToDelete, setClassToDelete] = useState<ClassItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const [startHour, setStartHour] = useState('9');
  const [startMinute, setStartMinute] = useState('00');
  const [startPeriod, setStartPeriod] = useState('AM');
  const [endHour, setEndHour] = useState('10');
  const [endMinute, setEndMinute] = useState('30');
  const [endPeriod, setEndPeriod] = useState('AM');
  
  const [form, setForm] = useState({ id: '', name: '', time: '', location: '', day: 'Thursday', color: '#4361ee' });

  const dayScrollViewRef = useRef<ScrollView>(null);
  const weekScrollViewRef = useRef<ScrollView>(null);
  const [classNameSuggestions, setClassNameSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Auto-scroll to today on mount
useEffect(() => {
  setTimeout(() => {
    dayScrollViewRef.current?.scrollTo({ 
      x: todayIdx * 83 - 120, // Center today tab
      animated: true 
    });
  }, 300);
}, []);



  // ========== DYNAMIC DAYS ==========
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const daysOfWeek = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  
  const getCurrentWeekDays = () => {
    const today = new Date();
    const cd = today.getDay(); // 0=Sun
    const mo = cd === 0 ? -6 : 1 - cd;
    const shorts = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    return daysOfWeek.map((dn, i) => {
      const d = new Date(today); d.setDate(today.getDate() + mo + i);
      return { name: shorts[i], date: String(d.getDate()), dayName: dn, isToday: i === (cd===0?6:cd-1) };
    });
  };
  const days = getCurrentWeekDays();
  const todayIdx = days.findIndex((d: any) => d.isToday);
  const [selectedDay, setSelectedDay] = useState(todayIdx >= 0 ? todayIdx : 0);

  // Create looped days: [last 2 days] + [all days] + [first 2 days]
const loopedDays = [
  ...days.slice(-2),  // Last 2 days at start
  ...days,            // All 7 days
  ...days.slice(0, 2) // First 2 days at end
];

  const allHours = [
    { label: '1', value: '1' }, { label: '2', value: '2' }, { label: '3', value: '3' },
    { label: '4', value: '4' }, { label: '5', value: '5' }, { label: '6', value: '6' },
    { label: '7', value: '7' }, { label: '8', value: '8' }, { label: '9', value: '9' },
    { label: '10', value: '10' }, { label: '11', value: '11' }, { label: '12', value: '12' },
  ];
  const minutes = ['00','15','30','45'];
  const periods = ['AM','PM'];
  const colorPalette = [
  '#FF0000', // Red
  '#FF7700', // Orange
  '#FFDD00', // Yellow
  '#00CC00', // Green
  '#0066FF', // Blue
  '#8B00FF', // Purple
  '#FF00FF', // Magenta
  '#00CCCC', // Teal
  '#8B4513', // Brown
  '#FF69B4', // Pink
  '#00FF88', // Mint
  '#4B0082', // Indigo
  '#FF4500', // Red-Orange
  '#1E90FF', // Dodger Blue
  '#32CD32', // Lime Green
  '#DC143C', // Crimson
  '#00CED1', // Dark Turquoise
  '#FF8C00', // Dark Orange
  '#9400D3', // Dark Violet
  '#008080', // Teal Dark
];

  const buildTimeString = () => `${startHour}:${startMinute} ${startPeriod} - ${endHour}:${endMinute} ${endPeriod}`;

  const parseTimeString = (ts: string) => {
    if (!ts) return;
    const p = ts.split('-');
    if (p.length >= 2) {
      const sm = p[0].trim().match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (sm) { setStartHour(sm[1]); setStartMinute(sm[2]); setStartPeriod(sm[3].toUpperCase()); }
      const em = p[1].trim().match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (em) { setEndHour(em[1]); setEndMinute(em[2]); setEndPeriod(em[3].toUpperCase()); }
    }
  };

  const handleDaySelect = (i: number) => { setSelectedDay(i); dayScrollViewRef.current?.scrollTo({ x: i*83-60, animated: true }); };

  const getUniqueClassNames = () => {
    const n = new Set<string>();
    (classes||[]).forEach((c: any) => { if (c.name?.trim()) n.add(c.name.trim()); });
    return Array.from(n).sort();
  };

  const getColorForClassName = (name: string) => {
    const c = (classes||[]).find((x: any) => x.name?.toLowerCase() === name.toLowerCase());
    return c?.color || null;
  };

  const handleClassNameChange = (text: string) => {
    setForm(p => ({ ...p, name: text }));
    if (text.trim()) {
      const ec = (classes||[]).find((c: any) => c.name?.toLowerCase() === text.trim().toLowerCase());
      if (ec) setForm(p => ({ ...p, color: ec.color }));
      const un = getUniqueClassNames().filter((n: string) => n.toLowerCase().includes(text.toLowerCase()));
      setClassNameSuggestions(un); setShowSuggestions(un.length > 0);
    } else { setShowSuggestions(false); setClassNameSuggestions([]); }
  };

  const selectSuggestion = (name: string) => {
    setForm(p => ({ ...p, name, color: getColorForClassName(name) || p.color }));
    setClassNameSuggestions([]); setShowSuggestions(false);
  };

const switchView = (v: 'day'|'week') => {
    setActiveView(v);
    setSelectedDay(todayIdx);
    setTimeout(() => {
      dayScrollViewRef.current?.scrollTo({ x: todayIdx * 83 - 120, animated: true });
      if (v === 'week') {
        weekScrollViewRef.current?.scrollTo({ x: todayIdx * DAY_COLUMN_WIDTH - 100, animated: true });
      }
    }, 100);
  };

  const CELL_HEIGHT = 55;
  const DAY_COLUMN_WIDTH = 79;

  const timeSlots = [
    { time24:'07:00',display:'7:00 AM',hour:7 },{ time24:'08:00',display:'8:00 AM',hour:8 },
    { time24:'09:00',display:'9:00 AM',hour:9 },{ time24:'10:00',display:'10:00 AM',hour:10 },
    { time24:'11:00',display:'11:00 AM',hour:11 },{ time24:'12:00',display:'12:00 PM',hour:12 },
    { time24:'13:00',display:'1:00 PM',hour:13 },{ time24:'14:00',display:'2:00 PM',hour:14 },
    { time24:'15:00',display:'3:00 PM',hour:15 },{ time24:'16:00',display:'4:00 PM',hour:16 },
    { time24:'17:00',display:'5:00 PM',hour:17 },{ time24:'18:00',display:'6:00 PM',hour:18 },
    { time24:'19:00',display:'7:00 PM',hour:19 },{ time24:'20:00',display:'8:00 PM',hour:20 },
    { time24:'21:00',display:'9:00 PM',hour:21 },
  ];

  const getClassesForDay = (dn: string) => {
    if (!classes?.length) return [];
    return classes.filter((c: any) => c.day===dn).sort((a: any,b: any) => convertTimeToMinutes(a.time)-convertTimeToMinutes(b.time));
  };

  const convertTimeToMinutes = (ts: string) => {
    if (!ts) return 0;
    const st = ts.split('-')[0].trim();
    let h=0,m=0,pm=false;
    const am = st.match(/(am|pm)/i);
    if (am) pm = am[1].toLowerCase()==='pm';
    const tp = st.replace(/(am|pm)/i,'').trim().split(':');
    h = parseInt(tp[0],10)||0; m = parseInt(tp[1],10)||0;
    if (pm && h<12) h+=12;
    if (!pm && h===12) h=0;
    return h*60+m;
  };

  const getUpcomingClasses = () => {
    const now = new Date();
    const cd = now.toLocaleDateString('en-US',{ weekday:'long' });
    const ctm = now.getHours()*60+now.getMinutes();
    const up: ClassItem[] = [];
    (classes||[]).forEach((c: any) => { if (c.day===cd && convertTimeToMinutes(c.time)>ctm) up.push(c); });
    return up.sort((a: any,b: any) => convertTimeToMinutes(a.time)-convertTimeToMinutes(b.time));
  };

  const openAddModal = () => {
    setModalMode('add');
    setForm({ id:'',name:'',time:'',location:'',day: days[todayIdx]?.dayName || 'Monday', color:'#4361ee' });
    setStartHour('9'); setStartMinute('00'); setStartPeriod('AM');
    setEndHour('10'); setEndMinute('30'); setEndPeriod('AM');
    setClassNameSuggestions([]); setShowSuggestions(false);
    setShowModal(true);
  };

  // Check for time conflicts
const hasTimeConflict = (day: string, startTime: string, endTime: string, excludeId?: string) => {
  const startMinutes = convertTimeToMinutes(startTime);
  const endMinutes = convertTimeToMinutes(endTime);
  
  return (classes || []).some((c: any) => {
    // Skip current class when editing
    if (excludeId && c.id === excludeId) return false;
    // Only check same day
    if (c.day !== day) return false;
    
    const existingStart = convertTimeToMinutes(c.time);
    const existingEnd = convertTimeToMinutes(c.time.split('-')[1]?.trim() || c.time);
    
    // Check if times overlap
    return (startMinutes < existingEnd && endMinutes > existingStart);
  });
};

  const openEditModal = (ci: ClassItem) => {
    setModalMode('edit');
    setForm({ id:ci.id, name:ci.name, time:ci.time, location:ci.location, day:ci.day, color:ci.color });
    parseTimeString(ci.time);
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

const saveClass = async () => {
    if (!form.name.trim() || !form.location.trim()) { 
      Alert.alert('Error', 'Please fill in all required fields.'); 
      return; 
    }
    
    const timeString = buildTimeString();
    const startPart = timeString.split('-')[0].trim();
    const endPart = timeString.split('-')[1].trim();
    
    // Check for conflicts
    if (hasTimeConflict(form.day, startPart, endPart, modalMode === 'edit' ? form.id : undefined)) {
      Alert.alert(
        'Time Conflict',
        `There is already a class scheduled on ${form.day} during this time. Please choose a different time or day.`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    setSaving(true);
    try {
      const body = JSON.stringify({ 
        name: form.name.trim(), 
        time: timeString, 
        location: form.location.trim(), 
        day: form.day, 
        color: form.color 
      });
      if (modalMode === 'add') {
        await apiFetch('/courses', { method: 'POST', body });
      } else {
        await apiFetch(`/courses/${form.id}`, { method: 'PUT', body });
      }
      refreshData();
      Alert.alert('Success', `Class ${modalMode === 'add' ? 'added' : 'updated'}!`);
      closeModal();
    } catch (e: any) { 
      Alert.alert('Error', e.message || 'Failed to save.'); 
    } finally { 
      setSaving(false); 
    }
  };

  const confirmDeleteClass = (ci: ClassItem) => { setClassToDelete(ci); setShowDeleteModal(true); };

  const deleteClass = async () => {
    if (!classToDelete) return; setDeleting(true);
    try { await apiFetch(`/courses/${classToDelete.id}`,{ method:'DELETE' }); refreshData(); Alert.alert('Deleted!'); setShowDeleteModal(false); setClassToDelete(null); }
    catch { Alert.alert('Error','Failed.'); }
    finally { setDeleting(false); }
  };

  const getClassTimeInfo = (ts: string) => {
    if (!ts) return { topOffset:0, height:CELL_HEIGHT };
    const p = ts.split('-');
    if (p.length>=2) { const sm=convertTimeToMinutes(p[0].trim()), em=convertTimeToMinutes(p[1].trim()); return { topOffset:((sm-420)/60)*CELL_HEIGHT, height:((em-sm)/60)*CELL_HEIGHT }; }
    return { topOffset:0, height:CELL_HEIGHT };
  };

  const weekDayHeaders = days.map((d: any) => ({ name: d.name, date: d.date }));

  const ITEM_WIDTH = 83; // Day tab width

// In the return, replace days.map with:
<ScrollView 
  ref={dayScrollViewRef}
  horizontal 
  showsHorizontalScrollIndicator={false}
  style={styles.dayTabs}
  snapToInterval={ITEM_WIDTH}
  decelerationRate="fast"
  contentOffset={{ x: todayIdx * ITEM_WIDTH + ITEM_WIDTH * 2, y: 0 }} // Start at actual position
  onMomentumScrollEnd={(e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / ITEM_WIDTH);
    // If scrolled to cloned items, jump to real position
    if (index <= 1) {
      dayScrollViewRef.current?.scrollTo({ x: (days.length + index) * ITEM_WIDTH, animated: false });
    } else if (index >= days.length + 2) {
      dayScrollViewRef.current?.scrollTo({ x: (index - days.length) * ITEM_WIDTH, animated: false });
    }
    const realIndex = ((index - 2) % days.length + days.length) % days.length;
    setSelectedDay(realIndex);
  }}
>
  {loopedDays.map((day: any, i: number) => (
    <TouchableOpacity key={i} style={[
      styles.dayTab, 
      (i - 2 + days.length) % days.length === selectedDay && styles.dayTabActive,
      (i - 2 + days.length) % days.length === todayIdx && styles.dayTabToday
    ]} onPress={() => {
      const realIdx = (i - 2 + days.length) % days.length;
      setSelectedDay(realIdx);
      dayScrollViewRef.current?.scrollTo({ x: i * ITEM_WIDTH - ITEM_WIDTH, animated: true });
    }}>
      <Text style={[
        styles.dayName,
        (i - 2 + days.length) % days.length === todayIdx && styles.dayNameToday,
        (i - 2 + days.length) % days.length === selectedDay && styles.dayNameActive
      ]}>{day.name}</Text>
      <Text style={[
        styles.dayDate,
        (i - 2 + days.length) % days.length === todayIdx && styles.dayDateToday,
        (i - 2 + days.length) % days.length === selectedDay && styles.dayDateActive
      ]}>{day.date}</Text>
      {(i - 2 + days.length) % days.length === todayIdx && (
        <View style={[styles.todayBadge, (i - 2 + days.length) % days.length === selectedDay && styles.todayBadgeActive]}>
          <Text style={styles.todayBadgeText}>TODAY</Text>
        </View>
      )}
    </TouchableOpacity>
  ))}
</ScrollView>

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fbfdff" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Week Navigator */}
        <View style={styles.weekNavigator}>
          <TouchableOpacity style={styles.weekNavBtn}><FontAwesome5 name="chevron-left" size={16} color="#475569" /></TouchableOpacity>
          <Text style={styles.weekRange}>{days[0]?.name} {days[0]?.date} - {days[6]?.name} {days[6]?.date}, <Text style={styles.weekYear}>{new Date().getFullYear()}</Text></Text>
          <TouchableOpacity style={styles.weekNavBtn}><FontAwesome5 name="chevron-right" size={16} color="#475569" /></TouchableOpacity>
        </View>

        {/* Day Tabs */}
        <View style={styles.dayTabsWrapper}>
          <ScrollView ref={dayScrollViewRef} horizontal showsHorizontalScrollIndicator={false} style={styles.dayTabs}>
            {days.map((day: any, i: number) => (
              <TouchableOpacity key={i} style={[styles.dayTab, selectedDay===i&&styles.dayTabActive, i===todayIdx&&styles.dayTabToday]} onPress={()=>handleDaySelect(i)}>
                <Text style={[styles.dayName, i===todayIdx&&styles.dayNameToday, selectedDay===i&&styles.dayNameActive]}>{day.name}</Text>
                <Text style={[styles.dayDate, i===todayIdx&&styles.dayDateToday, selectedDay===i&&styles.dayDateActive]}>{day.date}</Text>
                {i===todayIdx && <View style={[styles.todayBadge,selectedDay===i&&styles.todayBadgeActive]}><Text style={styles.todayBadgeText}>TODAY</Text></View>}
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.swipeHint}>{[0,1,2,3,4].map((_: number, i: number) => <View key={i} style={[styles.swipeDot, i===2&&styles.swipeDotActive]} />)}</View>
        </View>

        {/* Stats + View Toggle */}
        <View style={styles.statsToggleRow}>
          <View style={styles.countsContainer}>
            <View style={styles.countBadge}><FontAwesome5 name="book" size={12} color="#4361ee" /><Text style={styles.countNumber}>{(classes||[]).length}</Text><Text style={styles.countLabel}>Total</Text></View>
            <View style={styles.countBadge}><FontAwesome5 name="sun" size={12} color="#f59e0b" /><Text style={styles.countNumber}>{getClassesForDay(days[todayIdx]?.dayName).length}</Text><Text style={styles.countLabel}>Today</Text></View>
          </View>
          <View style={styles.viewToggleRow}>
            <TouchableOpacity style={[styles.viewToggleBtn,activeView==='day'&&styles.viewToggleBtnActive]} onPress={()=>switchView('day')}><FontAwesome5 name="calendar-day" size={12} color={activeView==='day'?'#FFF':'#64748b'} /><Text style={[styles.viewToggleText,activeView==='day'&&styles.viewToggleTextActive]}>Day</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.viewToggleBtn,activeView==='week'&&styles.viewToggleBtnActive]} onPress={()=>switchView('week')}><FontAwesome5 name="calendar-alt" size={12} color={activeView==='week'?'#FFF':'#64748b'} /><Text style={[styles.viewToggleText,activeView==='week'&&styles.viewToggleTextActive]}>Week</Text></TouchableOpacity>
          </View>
        </View>

        {/* Day View */}
        {activeView==='day' && (
          <View style={styles.scheduleContent}>
            <View style={styles.scheduleTimeline}>
              <View style={styles.timelineHeader}>
                <Text style={styles.timelineTitle}><FontAwesome5 name="calendar-alt" size={14} color="#1e293b" />  {days[selectedDay]?.dayName}, {monthNames[new Date().getMonth()]} {days[selectedDay]?.date}</Text>
                <Text style={styles.timelineCount}><FontAwesome5 name="clock" size={12} color="#4361ee" />  {getClassesForDay(days[selectedDay]?.dayName).length} classes</Text>
              </View>
              {getClassesForDay(days[selectedDay]?.dayName).map((ci: any) => (
                <View key={ci.id} style={styles.classBlock}>
                  <View style={styles.timeIndicatorContainer}><Text style={styles.timeIndicatorStart}>{ci.time?.split('-')[0]?.trim()}</Text><View style={styles.timeLine} /><Text style={styles.timeIndicatorEnd}>{ci.time?.split('-')[1]?.trim()}</Text></View>
                  <TouchableOpacity style={[styles.classCard,{borderLeftColor:ci.color,backgroundColor:ci.color+'10'}]} onPress={()=>openEditModal(ci)} onLongPress={()=>confirmDeleteClass(ci)}>
                    <Text style={styles.classTitle}>{ci.name}</Text>
                    <View style={styles.classDetails}><View style={styles.classDetail}><FontAwesome5 name="map-marker-alt" size={10} color="#8c9eb5" /><Text style={styles.classDetailText}> {ci.location}</Text></View><View style={[styles.classTypeBadge,{backgroundColor:ci.color+'20'}]}><Text style={[styles.classTypeText,{color:ci.color}]}>Class</Text></View></View>
                  </TouchableOpacity>
                </View>
              ))}
              {getClassesForDay(days[selectedDay]?.dayName).length===0 && <View style={{alignItems:'center',paddingVertical:30}}><FontAwesome5 name="calendar-day" size={40} color="#cbd5e1" /><Text style={{color:'#94a3b8',marginTop:12}}>No classes scheduled</Text></View>}
            </View>
          </View>
        )}

        {/* Week View */}
        {activeView==='week' && (
          <View style={styles.scheduleContent}>
            <View style={styles.weekGrid}>
              <View style={styles.weekGridRow}>
                <View style={styles.fixedTimeColumn}><View style={styles.timeColumnHeader} />{timeSlots.map((s: any,i: number)=><View key={i} style={[styles.timeSlotCell,{height:CELL_HEIGHT}]}><Text style={styles.timeSlotText}>{s.display}</Text></View>)}</View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollableDays} ref={weekScrollViewRef} onLayout={()=>{setTimeout(()=>weekScrollViewRef.current?.scrollTo({x:todayIdx*DAY_COLUMN_WIDTH-100,animated:true}),100)}}>
                  <View>
                    <View style={styles.weekHeader}>{weekDayHeaders.map((d: any,i: number)=><View key={i} style={[styles.dayColumnHeader,i===todayIdx&&styles.todayHeader]}><Text style={[styles.dayColumnText,i===todayIdx&&styles.todayHeaderText]}>{d.name} {d.date}</Text></View>)}</View>
                    <View style={{position:'relative',height:timeSlots.length*CELL_HEIGHT}}>
                      <View style={{position:'absolute',left:todayIdx*DAY_COLUMN_WIDTH,top:0,width:DAY_COLUMN_WIDTH,height:'100%',backgroundColor:'rgba(254,240,138,0.2)',borderRadius:8}} />
                      {timeSlots.map((_: any,ri: number)=><View key={ri} style={styles.weekRow}>{weekDayHeaders.map((__: any,di: number)=><View key={di} style={styles.weekCell} />)}</View>)}
{/* Week View Class Blocks */}
{days.map((day: any, di: number) => { 
  const dc = getClassesForDay(day.dayName); 
  return dc.map((cls: any) => { 
    const {topOffset, height} = getClassTimeInfo(cls.time); 
    return (
      <TouchableOpacity key={cls.id} style={[styles.classBlockOverlay,{
        left:di*DAY_COLUMN_WIDTH+2,
        top:topOffset,
        height:Math.max(height-2,25),
        backgroundColor:cls.color
      }]} onPress={()=>openEditModal(cls)} onLongPress={()=>confirmDeleteClass(cls)}>
        <Text style={styles.blockClassTitle} numberOfLines={1}>{cls.name}</Text>
        <View style={styles.blockClassRow}>
          <FontAwesome5 name="clock" size={6} color="rgba(255,255,255,0.9)" />
          <Text style={styles.blockClassTime} numberOfLines={1}>{cls.time}</Text>
        </View>
        <View style={styles.blockClassRow}>
          <FontAwesome5 name="map-marker-alt" size={6} color="rgba(255,255,255,0.9)" />
          <Text style={styles.blockClassLoc} numberOfLines={1}>{cls.location}</Text>
        </View>
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

        {/* Upcoming */}
        <View style={styles.summarySection}>
          <View style={styles.summaryHeader}><Text style={styles.summaryTitle}><FontAwesome5 name="forward" size={14} color="#1e293b" />  Coming up next</Text><TouchableOpacity><Text style={styles.sectionLink}>Today</Text></TouchableOpacity></View>
          <View style={styles.summaryCard}>
            {(() => { const uc = getUpcomingClasses(); if (!(classes||[]).length) return <Text style={{color:'#94a3b8',textAlign:'center',paddingVertical:16}}>Add classes to see them here</Text>; if (!uc.length) return <Text style={{color:'#94a3b8',textAlign:'center',paddingVertical:16}}>No more classes today</Text>; return uc.slice(0,4).map((item: any, i: number) => (<TouchableOpacity key={item.id} style={[styles.summaryItem,i<Math.min(uc.length,4)-1&&styles.summaryItemBorder]} onPress={()=>openEditModal(item)}><View style={styles.summaryTime}><Text style={styles.summaryTimeText}>{item.time}</Text></View><View style={styles.summaryInfo}><Text style={styles.summaryItemTitle}>{item.name}</Text><Text style={styles.summaryMeta}>{item.location}</Text></View><View style={[styles.colorDotSmall,{backgroundColor:item.color}]} /></TouchableOpacity>)); })()}
          </View>
        </View>
        <View style={{height:100}} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openAddModal}><FontAwesome5 name="plus" size={24} color="#FFF" /></TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}><View style={styles.modalContainer}>
          <View style={styles.modalHeader}><Text style={styles.modalTitle}><FontAwesome5 name={modalMode==='add'?'plus-circle':'edit'} size={18} color="#4361ee" /> {modalMode==='add'?'Add New Class':'Edit Class'}</Text><TouchableOpacity onPress={closeModal}><FontAwesome5 name="times" size={20} color="#64748b" /></TouchableOpacity></View>
          <ScrollView style={styles.modalBody} nestedScrollEnabled>
            <View style={styles.formGroup}><Text style={styles.formLabel}>Class Name *</Text><TextInput style={styles.formInput} placeholder="e.g., Mathematics" placeholderTextColor="#94a3b8" value={form.name} onChangeText={handleClassNameChange} autoCapitalize="words" />
              {showSuggestions && classNameSuggestions.length>0 && <View style={styles.suggestionsContainer}><ScrollView style={styles.suggestionsList} nestedScrollEnabled keyboardShouldPersistTaps="always">{classNameSuggestions.map((n: string,i: number)=>{const ec=getColorForClassName(n);return(<TouchableOpacity key={`s-${i}`} style={styles.suggestionItem} onPress={()=>selectSuggestion(n)}><View style={[styles.suggestionColorDot,{backgroundColor:ec||'#94a3b8'}]} /><Text style={styles.suggestionText}>{n}</Text>{ec&&<View style={styles.inheritBadge}><Text style={styles.inheritBadgeText}>color ✓</Text></View>}</TouchableOpacity>)})}</ScrollView></View>}
              {form.name.trim() && getColorForClassName(form.name.trim()) && <View style={styles.inheritNotice}><FontAwesome5 name="palette" size={10} color="#4361ee" /><Text style={styles.inheritNoticeText}>Color auto-assigned</Text></View>}
            </View>
            <View style={styles.formGroup}><Text style={styles.formLabel}>Time *</Text>
              <Text style={styles.timeSectionLabel}>Start</Text><View style={styles.timePickerRow}>
                <View style={styles.pickerContainer}><ScrollView style={styles.pickerScroll} nestedScrollEnabled>{allHours.map((h: any,i: number)=><TouchableOpacity key={`sh-${i}`} style={[styles.pickerItem,startHour===h.value&&styles.pickerItemActive]} onPress={()=>setStartHour(h.value)}><Text style={[styles.pickerItemText,startHour===h.value&&styles.pickerItemTextActive]}>{h.label}</Text></TouchableOpacity>)}</ScrollView></View>
                <Text style={styles.timeSeparator}>:</Text>
                <View style={styles.pickerContainer}><ScrollView style={styles.pickerScroll} nestedScrollEnabled>{minutes.map((m: string,i: number)=><TouchableOpacity key={`sm-${i}`} style={[styles.pickerItem,startMinute===m&&styles.pickerItemActive]} onPress={()=>setStartMinute(m)}><Text style={[styles.pickerItemText,startMinute===m&&styles.pickerItemTextActive]}>{m}</Text></TouchableOpacity>)}</ScrollView></View>
                <View style={styles.periodContainer}>{periods.map((p: string)=><TouchableOpacity key={`sp-${p}`} style={[styles.periodBtn,startPeriod===p&&styles.periodBtnActive]} onPress={()=>setStartPeriod(p)}><Text style={[styles.periodText,startPeriod===p&&styles.periodTextActive]}>{p}</Text></TouchableOpacity>)}</View>
              </View>
              <Text style={[styles.timeSectionLabel,{marginTop:12}]}>End</Text><View style={styles.timePickerRow}>
                <View style={styles.pickerContainer}><ScrollView style={styles.pickerScroll} nestedScrollEnabled>{allHours.map((h: any,i: number)=><TouchableOpacity key={`eh-${i}`} style={[styles.pickerItem,endHour===h.value&&styles.pickerItemActive]} onPress={()=>setEndHour(h.value)}><Text style={[styles.pickerItemText,endHour===h.value&&styles.pickerItemTextActive]}>{h.label}</Text></TouchableOpacity>)}</ScrollView></View>
                <Text style={styles.timeSeparator}>:</Text>
                <View style={styles.pickerContainer}><ScrollView style={styles.pickerScroll} nestedScrollEnabled>{minutes.map((m: string,i: number)=><TouchableOpacity key={`em-${i}`} style={[styles.pickerItem,endMinute===m&&styles.pickerItemActive]} onPress={()=>setEndMinute(m)}><Text style={[styles.pickerItemText,endMinute===m&&styles.pickerItemTextActive]}>{m}</Text></TouchableOpacity>)}</ScrollView></View>
                <View style={styles.periodContainer}>{periods.map((p: string)=><TouchableOpacity key={`ep-${p}`} style={[styles.periodBtn,endPeriod===p&&styles.periodBtnActive]} onPress={()=>setEndPeriod(p)}><Text style={[styles.periodText,endPeriod===p&&styles.periodTextActive]}>{p}</Text></TouchableOpacity>)}</View>
              </View>
              <View style={styles.timePreview}><FontAwesome5 name="clock" size={12} color="#4361ee" /><Text style={styles.timePreviewText}>{buildTimeString()}</Text></View>
            </View>
            <View style={styles.formGroup}><Text style={styles.formLabel}>Location *</Text><TextInput style={styles.formInput} placeholder="e.g., Room 302" placeholderTextColor="#94a3b8" value={form.location} onChangeText={(t)=>setForm(p=>({...p,location:t}))} /></View>
            <View style={styles.formGroup}><Text style={styles.formLabel}>Day *</Text><View style={styles.daySelector}>{daysOfWeek.map((d: string)=><TouchableOpacity key={d} style={[styles.dayOption,form.day===d&&styles.dayOptionActive]} onPress={()=>setForm(p=>({...p,day:d}))}><Text style={[styles.dayOptionText,form.day===d&&styles.dayOptionTextActive]}>{d.substring(0,3)}</Text></TouchableOpacity>)}</View></View>
            <View style={styles.formGroup}><Text style={styles.formLabel}>Color</Text><View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{colorPalette.map((c: string)=><TouchableOpacity key={c} style={[styles.colorSwatch,{backgroundColor:c},form.color===c&&styles.colorSwatchActive]} onPress={()=>setForm(p=>({...p,color:c}))} />)}</View></View>
          </ScrollView>
          <View style={styles.modalFooter}>
            {modalMode==='edit'&&<TouchableOpacity style={styles.deleteBtn} onPress={()=>{closeModal();confirmDeleteClass({id:form.id,name:form.name,time:buildTimeString(),location:form.location,day:form.day,color:form.color});}}><FontAwesome5 name="trash" size={16} color="#ef4444" /><Text style={styles.deleteBtnText}>Delete</Text></TouchableOpacity>}
            <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn,saving&&styles.btnDisabled]} onPress={saveClass} disabled={saving}><FontAwesome5 name={modalMode==='add'?'plus':'save'} size={14} color="#FFF" /><Text style={styles.saveBtnText}>{saving?'Saving...':(modalMode==='add'?'Add Class':'Update')}</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>

      {/* Delete Modal */}
      <Modal visible={showDeleteModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}><View style={styles.deleteModalContainer}>
          <FontAwesome5 name="trash-alt" size={48} color="#ef4444" style={{marginBottom:16}} />
          <Text style={styles.deleteTitle}>Delete Class</Text><Text style={styles.deleteMessage}>Delete "{classToDelete?.name}"?</Text>
          <View style={styles.deleteModalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={()=>setShowDeleteModal(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.confirmDeleteBtn,deleting&&styles.btnDisabled]} onPress={deleteClass} disabled={deleting}><Text style={styles.confirmDeleteText}>{deleting?'Deleting...':'Yes, Delete'}</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>
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
  todayBadgeText: { fontSize: 10, fontWeight: '600', color: '#f6f6fc' },
  todayBadgeTextActive: { color: '#f8f6f6' },
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
blockClassRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 3,
  marginTop: 1,
},
blockClassTime: { 
  fontSize: 7, 
  fontWeight: '500', 
  color: 'rgba(255,255,255,0.95)',
},
blockClassLoc: { 
  fontSize: 7, 
  color: 'rgba(255,255,255,0.85)',
},


});