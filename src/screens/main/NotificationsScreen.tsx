import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Calendar } from 'react-native-calendars';

interface NotificationItem {
  id: string;
  type: 'deadline' | 'status' | 'reminder' | 'info';
  title: string;
  body: string;
  createdAt: string;
  readAt?: string;
  priority: 'low' | 'normal' | 'high';
  data?: Record<string, any>;
}

interface DeadlineItem {
  id: string;
  type: 'vat' | 'zus' | 'pit' | 'cit' | 'ksef';
  name: string;
  dueDate: string;
  status: 'upcoming' | 'due' | 'overdue' | 'completed';
  priority: 'low' | 'normal' | 'high';
}

const NotificationsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'notifications' | 'deadlines' | 'calendar'>('notifications');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { currentCompany } = useSelector((state: RootState) => state.company);
  const authToken = useSelector((state: RootState) => state.auth.token);

  useEffect(() => {
    loadData();
  }, [currentCompany]);

  const loadData = async () => {
    if (!currentCompany?.id || !authToken) return;

    try {
      setLoading(true);
      await Promise.all([
        loadNotifications(),
        loadDeadlines(),
      ]);
    } catch (error) {
      console.error('Error loading notifications data:', error);
      Alert.alert('Błąd', 'Nie udało się załadować danych');
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      // Here you would make the actual API call
      // const response = await fetch('/api/notifications/user', {
      //   headers: {
      //     'Authorization': `Bearer ${authToken}`,
      //   },
      // });

      // Simulate API response
      const sampleNotifications: NotificationItem[] = [
        {
          id: '1',
          type: 'deadline',
          title: 'Przypomnienie: Termin VAT',
          body: 'Deklaracja VAT-7 za okres 2024-12 powinna zostać złożona do 2025-01-25',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          priority: 'high',
          data: { deadlineId: 'vat_2024_12' },
        },
        {
          id: '2',
          type: 'status',
          title: 'Status KSeF',
          body: 'Faktura INV/2024/001 została pomyślnie przesłana do KSeF',
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          readAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          priority: 'normal',
          data: { invoiceId: 'inv_001', referenceNumber: 'KSEF/2024/001' },
        },
        {
          id: '3',
          type: 'reminder',
          title: 'Faktura przeterminowana',
          body: 'Faktura INV/2024/002 na kwotę 1500.00 PLN jest przeterminowana od 5 dni',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          priority: 'high',
          data: { invoiceId: 'inv_002', daysOverdue: 5 },
        },
      ];

      setNotifications(sampleNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadDeadlines = async () => {
    try {
      // Here you would make the actual API call
      // const response = await fetch('/api/notifications/deadlines', {
      //   headers: {
      //     'Authorization': `Bearer ${authToken}`,
      //   },
      // });

      // Simulate API response
      const sampleDeadlines: DeadlineItem[] = [
        {
          id: 'vat_2024_12',
          type: 'vat',
          name: 'VAT-7 (grudzień 2024)',
          dueDate: '2025-01-25',
          status: 'upcoming',
          priority: 'high',
        },
        {
          id: 'zus_2025_01',
          type: 'zus',
          name: 'Składki ZUS (styczeń 2025)',
          dueDate: '2025-02-15',
          status: 'upcoming',
          priority: 'high',
        },
        {
          id: 'pit_2024',
          type: 'pit',
          name: 'PIT-36 (2024)',
          dueDate: '2025-04-30',
          status: 'upcoming',
          priority: 'normal',
        },
      ];

      setDeadlines(sampleDeadlines);
    } catch (error) {
      console.error('Error loading deadlines:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData().finally(() => setRefreshing(false));
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      // Here you would make the actual API call
      // await fetch(`/api/notifications/user/${notificationId}/read`, {
      //   method: 'PUT',
      //   headers: {
      //     'Authorization': `Bearer ${authToken}`,
      //   },
      // });

      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? { ...notif, readAt: new Date().toISOString() }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#dc3545';
      case 'normal': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return '#007AFF';
      case 'due': return '#ffc107';
      case 'overdue': return '#dc3545';
      case 'completed': return '#28a745';
      default: return '#6c757d';
    }
  };

  const renderNotificationItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        item.readAt && styles.notificationRead,
      ]}
      onPress={() => !item.readAt && markNotificationAsRead(item.id)}
    >
      <View style={styles.notificationHeader}>
        <View style={styles.notificationType}>
          <Text style={styles.notificationTypeText}>
            {item.type === 'deadline' ? '⏰' :
             item.type === 'status' ? '📊' :
             item.type === 'reminder' ? '🔔' : 'ℹ️'}
          </Text>
        </View>

        <View style={styles.notificationContent}>
          <Text style={[styles.notificationTitle, item.readAt && styles.notificationReadText]}>
            {item.title}
          </Text>
          <Text style={[styles.notificationBody, item.readAt && styles.notificationReadText]}>
            {item.body}
          </Text>
          <Text style={styles.notificationTime}>
            {new Date(item.createdAt).toLocaleString('pl-PL')}
          </Text>
        </View>

        <View style={styles.notificationActions}>
          <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(item.priority) }]} />
          {!item.readAt && <Text style={styles.unreadDot}>●</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderDeadlineItem = ({ item }: { item: DeadlineItem }) => (
    <TouchableOpacity style={styles.deadlineItem}>
      <View style={styles.deadlineHeader}>
        <View style={styles.deadlineType}>
          <Text style={styles.deadlineTypeText}>
            {item.type === 'vat' ? '📋' :
             item.type === 'zus' ? '👥' :
             item.type === 'pit' ? '📄' :
             item.type === 'cit' ? '🏢' : '🔗'}
          </Text>
        </View>

        <View style={styles.deadlineContent}>
          <Text style={styles.deadlineName}>{item.name}</Text>
          <Text style={styles.deadlineDueDate}>
            Termin: {new Date(item.dueDate).toLocaleDateString('pl-PL')}
          </Text>
        </View>

        <View style={styles.deadlineActions}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={[styles.deadlineStatus, { color: getStatusColor(item.status) }]}>
            {item.status === 'upcoming' ? 'Nadchodzący' :
             item.status === 'due' ? 'Pilny' :
             item.status === 'overdue' ? 'Przeterminowany' : 'Ukończony'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCalendarTab = () => {
    const markedDates: any = {};

    // Mark deadline dates
    deadlines.forEach(deadline => {
      const dateKey = deadline.dueDate;
      markedDates[dateKey] = {
        marked: true,
        dotColor: getStatusColor(deadline.status),
        selectedColor: getStatusColor(deadline.status),
      };
    });

    // Mark today
    const today = new Date().toISOString().split('T')[0];
    if (!markedDates[today]) {
      markedDates[today] = { marked: true, dotColor: '#007AFF' };
    }

    return (
      <View style={styles.calendarContainer}>
        <Calendar
          markedDates={markedDates}
          onDayPress={(day) => {
            const dayDeadlines = deadlines.filter(d => d.dueDate === day.dateString);
            if (dayDeadlines.length > 0) {
              Alert.alert(
                `Terminy na ${day.dateString}`,
                dayDeadlines.map(d => `• ${d.name} (${d.status})`).join('\n')
              );
            }
          }}
          theme={{
            backgroundColor: '#ffffff',
            calendarBackground: '#ffffff',
            textSectionTitleColor: '#b6c1cd',
            selectedDayBackgroundColor: '#007AFF',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#007AFF',
            dayTextColor: '#2d4150',
            textDisabledColor: '#d9e1e8',
            dotColor: '#007AFF',
            selectedDotColor: '#ffffff',
            arrowColor: '#007AFF',
            monthTextColor: '#2d4150',
            indicatorColor: '#007AFF',
            textDayFontSize: 16,
            textMonthFontSize: 18,
            textDayHeaderFontSize: 14,
          }}
        />

        <View style={styles.calendarLegend}>
          <Text style={styles.legendTitle}>Legenda:</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#007AFF' }]} />
              <Text style={styles.legendText}>Nadchodzący</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#ffc107' }]} />
              <Text style={styles.legendText}>Pilny</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#dc3545' }]} />
              <Text style={styles.legendText}>Przeterminowany</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#28a745' }]} />
              <Text style={styles.legendText}>Ukończony</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Ładowanie powiadomień...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {[
          { key: 'notifications', label: 'Powiadomienia' },
          { key: 'deadlines', label: 'Terminy' },
          { key: 'calendar', label: 'Kalendarz' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {activeTab === 'notifications' && (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Brak powiadomień</Text>
            </View>
          }
        />
      )}

      {activeTab === 'deadlines' && (
        <FlatList
          data={deadlines}
          renderItem={renderDeadlineItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Brak terminów</Text>
            </View>
          }
        />
      )}

      {activeTab === 'calendar' && renderCalendarTab()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  notificationItem: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationRead: {
    opacity: 0.7,
    borderLeftColor: '#28a745',
  },
  notificationHeader: {
    flexDirection: 'row',
  },
  notificationType: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationTypeText: {
    fontSize: 20,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  notificationReadText: {
    color: '#999',
  },
  notificationActions: {
    alignItems: 'center',
  },
  priorityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  unreadDot: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deadlineItem: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deadlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deadlineType: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deadlineTypeText: {
    fontSize: 20,
  },
  deadlineContent: {
    flex: 1,
  },
  deadlineName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  deadlineDueDate: {
    fontSize: 14,
    color: '#666',
  },
  deadlineActions: {
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  deadlineStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  calendarContainer: {
    flex: 1,
    padding: 16,
  },
  calendarLegend: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default NotificationsScreen;