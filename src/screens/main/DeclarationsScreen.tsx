import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { apiSlice } from '../../store/api/apiSlice';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface DeclarationItem {
  id: string;
  type: string;
  period: string;
  status: string;
  submittedAt?: string;
  upoNumber?: string;
}

interface DeadlineItem {
  type: string;
  period: string;
  deadline: string;
  description: string;
}

const DeclarationsScreen = ({ navigation }: any) => {
  const { currentCompany } = useSelector((state: RootState) => state.company as any);
  const { token } = useSelector((state: RootState) => state.auth as any);
  const [declarations, setDeclarations] = useState<DeclarationItem[]>([]);
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (currentCompany) {
      loadDeclarations();
      loadDeadlines();
    }
  }, [currentCompany]);

  const loadDeclarations = async () => {
    if (!currentCompany) return;

    try {
      setLoading(true);
      // This would typically use the declarations API
      // For now, using mock data
      setDeclarations([]);
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się załadować deklaracji');
    } finally {
      setLoading(false);
    }
  };

  const loadDeadlines = async () => {
    if (!currentCompany) return;

    try {
      // Use the declarations API to get deadlines
      const response = await fetch(
        `http://localhost:3000/declarations/deadlines/${currentCompany.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDeadlines(data.data);
        }
      }
    } catch (error) {
      console.error('Error loading deadlines:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadDeclarations(), loadDeadlines()]);
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return '#FFA500';
      case 'ready': return '#007AFF';
      case 'submitted': return '#28A745';
      case 'accepted': return '#28A745';
      case 'rejected': return '#DC3545';
      default: return '#6C757D';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Szkic';
      case 'ready': return 'Gotowa';
      case 'submitted': return 'Wysłana';
      case 'accepted': return 'Zaakceptowana';
      case 'rejected': return 'Odrzucona';
      default: return status;
    }
  };

  const renderDeclarationItem = ({ item }: { item: DeclarationItem }) => (
    <TouchableOpacity style={styles.declarationItem}>
      <View style={styles.declarationHeader}>
        <Text style={styles.declarationType}>{item.type}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      <Text style={styles.declarationPeriod}>{item.period}</Text>
      {item.submittedAt && (
        <Text style={styles.submissionDate}>
          Wysłana: {new Date(item.submittedAt).toLocaleDateString('pl-PL')}
        </Text>
      )}
      {item.upoNumber && (
        <Text style={styles.upoNumber}>UPO: {item.upoNumber}</Text>
      )}
    </TouchableOpacity>
  );

  const renderDeadlineItem = ({ item }: { item: DeadlineItem }) => {
    const isOverdue = new Date(item.deadline) < new Date();
    const daysUntilDeadline = Math.ceil(
      (new Date(item.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
      <TouchableOpacity style={[styles.deadlineItem, isOverdue && styles.overdueItem]}>
        <View style={styles.deadlineHeader}>
          <Text style={styles.deadlineType}>{item.type}</Text>
          <Text style={[styles.deadlineDays, isOverdue ? styles.overdueText : styles.upcomingText]}>
            {isOverdue ? 'Przeterminowana' : `${daysUntilDeadline} dni`}
          </Text>
        </View>
        <Text style={styles.deadlineDescription}>{item.description}</Text>
        <Text style={styles.deadlineDate}>
          Termin: {new Date(item.deadline).toLocaleDateString('pl-PL')}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Ładowanie deklaracji...</Text>
      </View>
    );
  }

  if (!currentCompany) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="business" size={64} color="#CCC" />
        <Text style={styles.emptyText}>Wybierz firmę, aby zobaczyć deklaracje</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Actions */}
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('DeclarationCreator')}
        >
          <Icon name="add" size={20} color="#FFF" />
          <Text style={styles.actionButtonText}>Nowa deklaracja</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('VATRegister')}
        >
          <Icon name="list" size={20} color="#FFF" />
          <Text style={styles.actionButtonText}>Rejestr VAT</Text>
        </TouchableOpacity>
      </View>

      {/* Upcoming Deadlines */}
      {deadlines.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nadchodzące terminy</Text>
          <FlatList
            data={deadlines.slice(0, 3)} // Show only next 3 deadlines
            renderItem={renderDeadlineItem}
            keyExtractor={(item) => `${item.type}-${item.period}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.deadlinesList}
          />
        </View>
      )}

      {/* Declarations List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Deklaracje</Text>
        {declarations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="assignment" size={48} color="#CCC" />
            <Text style={styles.emptyText}>Brak deklaracji</Text>
            <Text style={styles.emptySubtext}>
              Utwórz pierwszą deklarację lub poczekaj na automatyczne wygenerowanie
            </Text>
          </View>
        ) : (
          <FlatList
            data={declarations}
            renderItem={renderDeclarationItem}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  headerActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  deadlinesList: {
    marginBottom: 16,
  },
  deadlineItem: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    marginRight: 12,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  overdueItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#DC3545',
  },
  deadlineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deadlineType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  deadlineDays: {
    fontSize: 12,
    fontWeight: '500',
  },
  overdueText: {
    color: '#DC3545',
  },
  upcomingText: {
    color: '#FFA500',
  },
  deadlineDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  deadlineDate: {
    fontSize: 11,
    color: '#999',
  },
  declarationItem: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  declarationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  declarationType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  declarationPeriod: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  submissionDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  upoNumber: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default DeclarationsScreen;