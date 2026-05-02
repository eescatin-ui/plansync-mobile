// app/debug-users.tsx
import { FontAwesome5 } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import AppHeader from '../components/AppHeader';
import { userStorage } from '../services/userStorage';

type User = {
  id: string;
  name: string;
  email: string;
  avatar_color: string;
  created_at: string;
  password?: string;
};

export default function DebugUsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const allUsers = await userStorage.getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const wipeAllUsers = () => {
    Alert.alert(
      'Delete All Users',
      'This will remove all registered users. This cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            await userStorage.saveAllUsers([]);
            setUsers([]);
            Alert.alert('Done', 'All users deleted');
          },
        },
      ]
    );
  };

  const deleteUser = (userId: string, userName: string) => {
    Alert.alert(
      'Delete User',
      `Delete "${userName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await userStorage.deleteUser(userId);
            await loadUsers();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Users Data" icon="users" />
      
      <ScrollView contentContainerStyle={styles.content}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <FontAwesome5 name="users" size={20} color="#4361ee" />
            <Text style={styles.statNumber}>{users.length}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
          <TouchableOpacity style={styles.wipeBtn} onPress={wipeAllUsers}>
            <FontAwesome5 name="trash" size={14} color="#ef4444" />
            <Text style={styles.wipeText}>Delete All</Text>
          </TouchableOpacity>
        </View>

        {/* Users List */}
        {users.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome5 name="user-slash" size={40} color="#cbd5e1" />
            <Text style={styles.emptyText}>No users registered</Text>
          </View>
        ) : (
          users.map((user, index) => (
            <View key={user.id} style={styles.userCard}>
              {/* Avatar */}
              <View style={[styles.avatar, { backgroundColor: user.avatar_color || '#4361ee' }]}>
                <Text style={styles.avatarText}>
                  {(user.name?.charAt(0) || 'U').toUpperCase()}
                </Text>
              </View>
              
              {/* User Info */}
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name || 'Unknown'}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <Text style={styles.userId}>ID: {user.id.substring(0, 16)}...</Text>
                <Text style={styles.userDate}>
                  Created: {new Date(user.created_at).toLocaleDateString()}
                </Text>
              </View>

              {/* Delete Button */}
              <TouchableOpacity 
                style={styles.deleteBtn}
                onPress={() => deleteUser(user.id, user.name)}
              >
                <FontAwesome5 name="trash-alt" size={14} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Refresh Button */}
        <TouchableOpacity style={styles.refreshBtn} onPress={loadUsers}>
          <FontAwesome5 name="sync" size={16} color="#FFFFFF" />
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fbfdff',
  },
  content: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eef2f6',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  wipeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  wipeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 12,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f0f4fc',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 2,
  },
  userId: {
    fontSize: 10,
    color: '#94a3b8',
  },
  userDate: {
    fontSize: 10,
    color: '#94a3b8',
  },
  deleteBtn: {
    padding: 8,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4361ee',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
  },
  refreshText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});