import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { eDeklaracjeService, StatusSummary } from '../services/eDeklaracjeService';
import { RootState } from '../store';

type RootStackParamList = {
  EDeklaracje: undefined;
  UPOList: { companyId: string };
  SubmissionStatus: { companyId: string };
  FailedDeclarations: { companyId: string };
};

type EDeklaracjeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface StatusCard {
  title: string;
  count: number;
  color: string;
  icon: string;
  status: string;
}

const EDeklaracjeScreen: React.FC = () => {
  const navigation = useNavigation<EDeklaracjeScreenNavigationProp>();
  const selectedCompany = useSelector((state: RootState) => state.company.currentCompany);

  const [statusSummary, setStatusSummary] = useState<StatusSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message: string } | null>(null);

  const loadData = useCallback(async () => {
    if (!selectedCompany) return;

    try {
      setLoading(true);

      // Load status summary
      const summary = await eDeklaracjeService.getStatusSummary(selectedCompany.id);
      setStatusSummary(summary);

      // Test connection
      const connection = await eDeklaracjeService.testConnection();
      setConnectionStatus(connection);

    } catch (error) {
      console.error('Failed to load e-Deklaracje data:', error);
      Alert.alert('Błąd', 'Nie udało się załadować danych e-Deklaracje');
    } finally {
      setLoading(false);
    }
  }, [selectedCompany]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const getStatusCards = (): StatusCard[] => {
    if (!statusSummary) return [];

    return [
      {
        title: 'Szkice',
        count: statusSummary.draft,
        color: '#6B7280',
        icon: 'edit',
        status: 'draft'
      },
      {
        title: 'Wysłane',
        count: statusSummary.submitted,
        color: '#F59E0B',
        icon: 'send',
        status: 'submitted'
      },
      {
        title: 'Przetwarzane',
        count: statusSummary.processing,
        color: '#3B82F6',
        icon: 'hourglass-empty',
        status: 'processing'
      },
      {
        title: 'Zaakceptowane',
        count: statusSummary.accepted,
        color: '#10B981',
        icon: 'check-circle',
        status: 'accepted'
      },
      {
        title: 'Odrzucone',
        count: statusSummary.rejected,
        color: '#EF4444',
        icon: 'cancel',
        status: 'rejected'
      },
      {
        title: 'Błędne',
        count: statusSummary.failed,
        color: '#DC2626',
        icon: 'error',
        status: 'failed'
      }
    ];
  };

  const handleStatusCardPress = (status: string) => {
    if (!selectedCompany) return;

    switch (status) {
      case 'accepted':
        navigation.navigate('UPOList', { companyId: selectedCompany.id });
        break;
      case 'failed':
      case 'rejected':
        navigation.navigate('FailedDeclarations', { companyId: selectedCompany.id });
        break;
      default:
        navigation.navigate('SubmissionStatus', { companyId: selectedCompany.id });
        break;
    }
  };

  const renderStatusCard = (card: StatusCard) => (
    <TouchableOpacity
      key={card.status}
      style={[styles.statusCard, { borderLeftColor: card.color }]}
      onPress={() => handleStatusCardPress(card.status)}
    >
      <View style={styles.cardHeader}>
        <Icon name={card.icon} size={24} color={card.color} />
        <Text style={[styles.cardTitle, { color: card.color }]}>{card.title}</Text>
      </View>
      <Text style={[styles.cardCount, { color: card.color }]}>{card.count}</Text>
    </TouchableOpacity>
  );

  const renderConnectionStatus = () => {
    if (!connectionStatus) return null;

    return (
      <View style={[
        styles.connectionStatus,
        { backgroundColor: connectionStatus.success ? '#D1FAE5' : '#FEE2E2' }
      ]}>
        <Icon
          name={connectionStatus.success ? 'check-circle' : 'error'}
          size={20}
          color={connectionStatus.success ? '#10B981' : '#EF4444'}
        />
        <Text style={[
          styles.connectionText,
          { color: connectionStatus.success ? '#10B981' : '#EF4444' }
        ]}>
          {connectionStatus.message}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Ładowanie danych e-Deklaracje...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!selectedCompany) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="business" size={48} color="#6B7280" />
          <Text style={styles.errorText}>Wybierz firmę, aby wyświetlić dane e-Deklaracje</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>e-Deklaracje</Text>
          <Text style={styles.headerSubtitle}>Platforma składania deklaracji podatkowych</Text>
          {renderConnectionStatus()}
        </View>

        {/* Status Cards */}
        <View style={styles.statusGrid}>
          {getStatusCards().map(renderStatusCard)}
        </View>

        {/* Summary Info */}
        {statusSummary && (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Podsumowanie (ostatnie 30 dni)</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>Łącznie deklaracji:</Text>
              <Text style={styles.summaryValue}>{statusSummary.total}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>Ostatnia aktualizacja:</Text>
              <Text style={styles.summaryValue}>
                {new Date(statusSummary.lastUpdated).toLocaleString('pl-PL')}
              </Text>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('UPOList', { companyId: selectedCompany.id })}
          >
            <Icon name="receipt" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Zobacz UPO</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('SubmissionStatus', { companyId: selectedCompany.id })}
          >
            <Icon name="track-changes" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Status zgłoszeń</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 12,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  connectionText: {
    fontSize: 14,
    marginLeft: 8,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'space-between',
  },
  statusCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  cardCount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryText: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 0.48,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default EDeklaracjeScreen;