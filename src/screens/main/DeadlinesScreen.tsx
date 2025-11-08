import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { RootState } from '../../store';
import { useGetDeadlinesQuery, useMarkDeadlineCompletedMutation } from '../../store/api/apiSlice';

interface DeadlineItem {
  id: string;
  type: 'vat' | 'zus' | 'pit' | 'cit' | 'ksef';
  name: string;
  description: string;
  dueDate: string;
  period: string;
  status: 'upcoming' | 'due' | 'overdue' | 'completed';
  daysUntilDue: number;
  priority: 'low' | 'normal' | 'high';
  amount?: number;
}

const DeadlineCard: React.FC<{
  item: DeadlineItem;
  onMarkCompleted: (id: string) => void;
}> = ({ item, onMarkCompleted }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue':
        return '#F44336';
      case 'due':
        return '#FF9800';
      case 'upcoming':
        return '#2196F3';
      case 'completed':
        return '#4CAF50';
      default:
        return '#666';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'normal':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'info';
    }
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `${Math.abs(diffDays)} dni temu`;
    } else if (diffDays === 0) {
      return 'Dzisiaj';
    } else if (diffDays === 1) {
      return 'Jutro';
    } else {
      return `Za ${diffDays} dni`;
    }
  };

  const formatPeriod = (period: string) => {
    // Convert YYYY-MM to readable format for monthly periods
    if (period.includes('-') && !period.includes('Q')) {
      const [year, month] = period.split('-');
      const monthNames = [
        'sty', 'lut', 'mar', 'kwi', 'maj', 'cze',
        'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'
      ];
      return `${monthNames[parseInt(month) - 1]}/${year}`;
    }

    // Convert YYYY-QX to readable format for quarterly periods
    if (period.includes('-Q')) {
      return period.replace('-Q', ' K');
    }

    return period;
  };

  return (
    <TouchableOpacity
      style={[
        styles.deadlineCard,
        { borderLeftColor: getStatusColor(item.status) }
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <Icon
            name={getPriorityIcon(item.priority)}
            size={20}
            color={getStatusColor(item.status)}
          />
          <Text style={[styles.deadlineName, { color: getStatusColor(item.status) }]}>
            {item.name}
          </Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={[styles.statusText, { backgroundColor: getStatusColor(item.status) }]}>
            {item.status === 'overdue' ? 'Przeterminowane' :
             item.status === 'due' ? 'Termin upływa' :
             item.status === 'upcoming' ? 'Nadchodzące' : 'Ukończone'}
          </Text>
        </View>
      </View>

      <Text style={styles.deadlineDescription}>{item.description}</Text>

      <View style={styles.cardFooter}>
        <View style={styles.periodContainer}>
          <Icon name="date-range" size={16} color="#666" />
          <Text style={styles.periodText}>{formatPeriod(item.period)}</Text>
        </View>

        <View style={styles.dueDateContainer}>
          <Icon name="schedule" size={16} color="#666" />
          <Text style={[
            styles.dueDateText,
            { color: getStatusColor(item.status) }
          ]}>
            {formatDueDate(item.dueDate)}
          </Text>
        </View>
      </View>

      {item.amount && (
        <View style={styles.amountContainer}>
          <Text style={styles.amountText}>
            Kwota: {item.amount.toLocaleString('pl-PL', {
              style: 'currency',
              currency: 'PLN'
            })}
          </Text>
        </View>
      )}

      {item.status !== 'completed' && (
        <TouchableOpacity
          style={[styles.completeButton, { borderColor: getStatusColor(item.status) }]}
          onPress={() => onMarkCompleted(item.id)}
        >
          <Text style={[styles.completeButtonText, { color: getStatusColor(item.status) }]}>
            Oznacz jako ukończone
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const DeadlinesScreen: React.FC = () => {
  const { currentCompany } = useSelector((state: RootState) => state.company as any);
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: deadlinesResponse,
    isLoading,
    refetch,
    error
  } = useGetDeadlinesQuery({
    daysAhead: 90 // Get deadlines for next 90 days
  });

  const [markDeadlineCompleted] = useMarkDeadlineCompletedMutation();

  const deadlines = deadlinesResponse?.data || [];

  useEffect(() => {
    if (error) {
      Alert.alert(
        'Błąd',
        'Nie udało się pobrać terminów. Spróbuj ponownie.',
        [{ text: 'OK' }]
      );
    }
  }, [error]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleMarkCompleted = async (deadlineId: string) => {
    try {
      await markDeadlineCompleted(deadlineId).unwrap();
      Alert.alert('Sukces', 'Termin został oznaczony jako ukończony.');
      refetch();
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się oznaczyć terminu jako ukończonego.');
    }
  };

  const groupDeadlinesByStatus = (deadlines: DeadlineItem[]) => {
    const grouped = {
      overdue: deadlines.filter(d => d.status === 'overdue'),
      due: deadlines.filter(d => d.status === 'due'),
      upcoming: deadlines.filter(d => d.status === 'upcoming'),
      completed: deadlines.filter(d => d.status === 'completed'),
    };
    return grouped;
  };

  const renderDeadlineSection = (title: string, items: DeadlineItem[]) => {
    if (items.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {items.map((item) => (
          <DeadlineCard
            key={item.id}
            item={item}
            onMarkCompleted={handleMarkCompleted}
          />
        ))}
      </View>
    );
  };

  if (isLoading && !deadlines.length) {
    return (
      <View style={styles.centerContainer}>
        <Text>Ładowanie terminów...</Text>
      </View>
    );
  }

  const groupedDeadlines = groupDeadlinesByStatus(deadlines);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Terminy deklaracji</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Icon name="refresh" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={[]}
        renderItem={() => null}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="event-note" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Brak terminów do wyświetlenia</Text>
          </View>
        }
        contentContainerStyle={styles.listContainer}
      >
        {renderDeadlineSection('Przeterminowane', groupedDeadlines.overdue)}
        {renderDeadlineSection('Termin upływa wkrótce', groupedDeadlines.due)}
        {renderDeadlineSection('Nadchodzące', groupedDeadlines.upcoming)}
        {renderDeadlineSection('Ukończone', groupedDeadlines.completed)}
      </FlatList>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    padding: 5,
  },
  listContainer: {
    padding: 15,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  deadlineCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deadlineName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#ccc',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  deadlineDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  periodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  periodText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDateText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: 'bold',
  },
  amountContainer: {
    marginBottom: 8,
  },
  amountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  completeButton: {
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  completeButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
});

export default DeadlinesScreen;